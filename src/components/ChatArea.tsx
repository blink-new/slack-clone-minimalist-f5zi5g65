import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Hash, AtSign, MessageCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { blink } from '../blink/client'
import type { RealtimeChannel } from '@blinkdotnew/sdk'

interface Message {
  id: string
  content: string
  user: {
    name: string
    avatar?: string
  }
  timestamp: Date
  isOwn?: boolean
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

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
            isOwn: realtimeMessage.userId === user.id
          }
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
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
          isOwn: msg.userId === user.id
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
  }, [channelId, dmId])

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id || !channelRef.current) return

    try {
      await channelRef.current.publish('chat', {
        content: message,
        timestamp: Date.now()
      }, {
        userId: user.id,
        metadata: { 
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          avatar: user.avatar || ''
        }
      })
      
      setMessage('')
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
      }
      setMessages(prev => [...prev, fallbackMessage])
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
      <div className="px-6 py-4 border-b border-gray-200">
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
      <ScrollArea className="flex-1 px-6">
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
                    
                    <div className={`px-4 py-2 rounded-lg ${
                      msg.isOwn 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              placeholder={`Message ${currentTitle}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-20 py-3 resize-none border-gray-200 focus:border-gray-300"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
            disabled={!message.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}