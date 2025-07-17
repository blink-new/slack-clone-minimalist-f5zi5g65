import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Hash, AtSign, MessageCircle, File, Image, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import type { RealtimeChannel } from '@blinkdotnew/sdk'

interface FileAttachment {
  name: string
  url: string
  type: string
  size: number
}

interface Message {
  id: string
  content: string
  user: {
    name: string
    avatar?: string
  }
  timestamp: Date
  isOwn?: boolean
  attachments?: FileAttachment[]
}

interface ChatAreaProps {
  channelId?: string
  dmId?: string
  channelName?: string
  dmName?: string
}

export function ChatArea({ channelId, dmId, channelName, dmName }: ChatAreaProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Get user authentication state
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Set up real-time messaging
  useEffect(() => {
    if (!user?.id || (!channelId && !dmId)) return

    let channel: RealtimeChannel | null = null
    
    const setupRealtime = async () => {
      const roomId = channelId ? `channel-${channelId}` : `dm-${[user.id, dmId].sort().join('-')}`
      channel = blink.realtime.channel(roomId)
      channelRef.current = channel
      
      await channel.subscribe({
        userId: user.id,
        metadata: { 
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          avatar: user.avatar || ''
        }
      })
      
      // Listen for new messages
      channel.onMessage((realtimeMessage) => {
        if (realtimeMessage.type === 'chat') {
          const newMessage: Message = {
            id: realtimeMessage.id,
            content: realtimeMessage.data.content,
            user: {
              name: realtimeMessage.metadata?.displayName || 'Anonymous',
              avatar: realtimeMessage.metadata?.avatar || ''
            },
            timestamp: new Date(realtimeMessage.timestamp),
            isOwn: realtimeMessage.userId === user.id,
            attachments: realtimeMessage.data.attachments || []
          }
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        } else if (realtimeMessage.type === 'typing') {
          const typingUserId = realtimeMessage.userId
          const isTyping = realtimeMessage.data.isTyping
          const userName = realtimeMessage.metadata?.displayName || 'Someone'
          
          if (typingUserId !== user.id) {
            setTypingUsers(prev => {
              if (isTyping) {
                return prev.includes(userName) ? prev : [...prev, userName]
              } else {
                return prev.filter(name => name !== userName)
              }
            })
            
            // Auto-remove typing indicator after 3 seconds
            if (isTyping) {
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(name => name !== userName))
              }, 3000)
            }
          }
        }
      })
      
      // Load recent messages
      try {
        const recentMessages = await channel.getMessages({ limit: 50 })
        const formattedMessages: Message[] = recentMessages.map(msg => ({
          id: msg.id,
          content: msg.data.content,
          user: {
            name: msg.metadata?.displayName || 'Anonymous',
            avatar: msg.metadata?.avatar || ''
          },
          timestamp: new Date(msg.timestamp),
          isOwn: msg.userId === user.id,
          attachments: msg.data.attachments || []
        }))
        setMessages(formattedMessages)
      } catch (error) {
        console.error('Failed to load messages:', error)
        // Set some default messages if loading fails
        setMessages([
          {
            id: 'welcome-1',
            content: 'Welcome to the team workspace! 👋',
            user: { name: 'System', avatar: '' },
            timestamp: new Date(Date.now() - 3600000),
          }
        ])
      }
    }
    
    setupRealtime().catch(console.error)
    
    return () => {
      channel?.unsubscribe()
      channelRef.current = null
    }
  }, [user?.id, user?.displayName, user?.email, user?.avatar, channelId, dmId])

  // Clear messages when switching channels/DMs
  useEffect(() => {
    setMessages([])
    setAttachments([])
    setTypingUsers([])
  }, [channelId, dmId])

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return
    
    setUploading(true)
    const newAttachments: FileAttachment[] = []
    
    try {
      for (const file of Array.from(files)) {
        const { publicUrl } = await blink.storage.upload(
          file,
          `chat-files/${Date.now()}-${file.name}`,
          { upsert: true }
        )
        
        newAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        })
      }
      
      setAttachments(prev => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const sendTypingIndicator = (isTyping: boolean) => {
    if (!channelRef.current || !user?.id) return
    
    channelRef.current.publish('typing', {
      isTyping,
      timestamp: Date.now()
    }, {
      userId: user.id,
      metadata: { 
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        avatar: user.avatar || ''
      }
    }).catch(console.error)
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || !user?.id || !channelRef.current) return

    try {
      await channelRef.current.publish('chat', {
        content: message,
        attachments: attachments,
        timestamp: Date.now()
      }, {
        userId: user.id,
        metadata: { 
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          avatar: user.avatar || ''
        }
      })
      
      setMessage('')
      setAttachments([])
      sendTypingIndicator(false)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Fallback: add message locally if real-time fails
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: message,
        user: { 
          name: user.displayName || user.email?.split('@')[0] || 'You',
          avatar: user.avatar || ''
        },
        timestamp: new Date(),
        isOwn: true,
        attachments: attachments
      }
      setMessages(prev => [...prev, fallbackMessage])
      setMessage('')
      setAttachments([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)
    
    // Send typing indicator
    if (value.trim() && !typingTimeoutRef.current) {
      sendTypingIndicator(true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false)
      typingTimeoutRef.current = null
    }, 1000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImageFile = (type: string) => {
    return type.startsWith('image/')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const currentTitle = channelId ? `#${channelName || channelId}` : dmName || dmId

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          {channelId ? (
            <Hash className="w-5 h-5 mr-2 text-gray-600" />
          ) : (
            <div className="relative mr-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs bg-gray-200">
                  {dmName?.split(' ').map(n => n[0]).join('') || 'DM'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-black">{currentTitle}</h2>
        </div>
        {channelId && (
          <p className="text-sm text-gray-500 mt-1">
            Team discussion and collaboration
          </p>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 md:px-6">
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {channelId ? (
                  <Hash className="w-8 h-8 text-gray-400" />
                ) : (
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {channelId ? `Welcome to #${channelName || channelId}` : `Start a conversation with ${dmName || dmId}`}
              </h3>
              <p className="text-gray-500 max-w-md">
                {channelId 
                  ? "This is the beginning of the channel. Send a message to get the conversation started!"
                  : "This is the beginning of your direct message history. Say hello!"
                }
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
            const showDate = index === 0 || 
              formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp)
            
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
                      {formatDate(msg.timestamp)}
                    </div>
                  </div>
                )}
                
                <div className={`flex items-start space-x-3 ${msg.isOwn ? 'justify-end' : ''}`}>
                  {!msg.isOwn && (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={msg.user.avatar} />
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {msg.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'} max-w-lg`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {msg.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                      msg.isOwn 
                        ? 'bg-indigo-500 text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}>
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      
                      {/* File Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`mt-2 space-y-2 ${msg.content ? 'border-t border-opacity-20 pt-2' : ''} ${
                          msg.isOwn ? 'border-white' : 'border-gray-300'
                        }`}>
                          {msg.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              {isImageFile(attachment.type) ? (
                                <div className="relative">
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.name}
                                    className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  />
                                </div>
                              ) : (
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center space-x-2 p-2 rounded border transition-colors ${
                                    msg.isOwn 
                                      ? 'border-white border-opacity-30 hover:bg-white hover:bg-opacity-10' 
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <File className="w-4 h-4 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                                    <p className={`text-xs opacity-75`}>{formatFileSize(attachment.size)}</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {msg.isOwn && (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={msg.user.avatar} />
                      <AvatarFallback className="bg-indigo-500 text-white">
                        {msg.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            )
          })
          )}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-4 md:px-6 py-4 border-t border-gray-200">
        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative bg-gray-100 rounded-lg p-2 flex items-center space-x-2 max-w-xs">
                {isImageFile(attachment.type) ? (
                  <Image className="w-4 h-4 text-gray-500" />
                ) : (
                  <File className="w-4 h-4 text-gray-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              placeholder={`Message ${currentTitle}...`}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              className="pr-20 py-3 resize-none border-gray-200 focus:border-gray-300"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="w-4 h-4 text-gray-400" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Smile className="w-4 h-4 text-gray-400" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <AtSign className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={(!message.trim() && attachments.length === 0) || uploading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}