interface StatusIndicatorProps {
  status: 'online' | 'away' | 'offline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusIndicator({ status, size = 'md', className = '' }: StatusIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'w-2 h-2'
      case 'md': return 'w-2.5 h-2.5'
      case 'lg': return 'w-3 h-3'
      default: return 'w-2.5 h-2.5'
    }
  }

  return (
    <div className={`${getSizeClasses(size)} ${getStatusColor(status)} rounded-full border border-white ${className}`} />
  )
}