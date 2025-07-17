import { useEffect, useState } from 'react'
import { X, MessageCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface NotificationProps {
  message: {
    content: string
    user: {
      name: string
      avatar?: string
    }
    channelName?: string
  }
  onClose: () => void
  onClick: () => void
}

export function MessageNotification({ message, onClose, onClick }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(dismissTimer)
    }
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
           onClick={onClick}>
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={message.user.avatar} />
            <AvatarFallback className="bg-gray-200 text-gray-700">
              {message.user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.user.name}
              </p>
              {message.channelName && (
                <div className="flex items-center text-xs text-gray-500">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  #{message.channelName}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {message.content}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}