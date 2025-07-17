import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Hash, AtSign } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey everyone! Welcome to the team workspace 👋',
      user: { name: 'John Doe', avatar: '' },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      content: 'Thanks for setting this up! Looking forward to collaborating here.',
      user: { name: 'Sarah Wilson', avatar: '' },
      timestamp: new Date(Date.now() - 3000000),
    },
    {
      id: '3',
      content: 'This looks great! The minimalist design is perfect for our workflow.',
      user: { name: 'Mike Johnson', avatar: '' },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: '4',
      content: 'Agreed! Clean and simple is the way to go. Ready to get started!',
      user: { name: 'Your Name', avatar: '' },
      timestamp: new Date(Date.now() - 900000),
      isOwn: true,
    }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      user: { name: 'Your Name', avatar: '' },
      timestamp: new Date(),
      isOwn: true,
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')
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
          {messages.map((msg, index) => {
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
          })}
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