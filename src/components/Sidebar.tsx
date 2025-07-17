import { useState } from 'react'
import { Hash, MessageCircle, Plus, Search, Settings, ChevronDown, Users, Bell } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'

interface SidebarProps {
  selectedChannel: string
  onChannelSelect: (channelId: string) => void
  selectedDM: string
  onDMSelect: (dmId: string) => void
}

export function Sidebar({ selectedChannel, onChannelSelect, selectedDM, onDMSelect }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)

  const channels = [
    { id: 'general', name: 'general', unread: 0 },
    { id: 'random', name: 'random', unread: 2 },
    { id: 'announcements', name: 'announcements', unread: 0 },
    { id: 'development', name: 'development', unread: 5 },
    { id: 'design', name: 'design', unread: 1 },
  ]

  const directMessages = [
    { id: 'john', name: 'John Doe', status: 'online', unread: 0 },
    { id: 'sarah', name: 'Sarah Wilson', status: 'online', unread: 3 },
    { id: 'mike', name: 'Mike Johnson', status: 'away', unread: 0 },
    { id: 'emma', name: 'Emma Davis', status: 'offline', unread: 1 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDMs = directMessages.filter(dm =>
    dm.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-black">Team Workspace</h1>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search channels, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-white border-gray-200 focus:border-gray-300"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Channels Section */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full justify-start px-2 py-1 h-auto text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${channelsExpanded ? '' : '-rotate-90'}`} />
              Channels
            </Button>
            
            {channelsExpanded && (
              <div className="mt-1 space-y-0.5">
                {filteredChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    onClick={() => onChannelSelect(channel.id)}
                    className={`w-full justify-start px-2 py-1.5 h-auto text-sm hover:bg-gray-100 ${
                      selectedChannel === channel.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{channel.name}</span>
                    {channel.unread > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs bg-red-500 text-white">
                        {channel.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
                
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 h-auto text-sm text-gray-500 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add channel
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Direct Messages Section */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => setDmsExpanded(!dmsExpanded)}
              className="w-full justify-start px-2 py-1 h-auto text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${dmsExpanded ? '' : '-rotate-90'}`} />
              Direct Messages
            </Button>
            
            {dmsExpanded && (
              <div className="mt-1 space-y-0.5">
                {filteredDMs.map((dm) => (
                  <Button
                    key={dm.id}
                    variant="ghost"
                    onClick={() => onDMSelect(dm.id)}
                    className={`w-full justify-start px-2 py-1.5 h-auto text-sm hover:bg-gray-100 ${
                      selectedDM === dm.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="relative mr-2 flex-shrink-0">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs bg-gray-200">
                          {dm.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getStatusColor(dm.status)}`} />
                    </div>
                    <span className="truncate flex-1 text-left">{dm.name}</span>
                    {dm.unread > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs bg-red-500 text-white">
                        {dm.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
                
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 h-auto text-sm text-gray-500 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add teammate
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Quick Actions */}
          <div className="space-y-0.5">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 h-auto text-sm text-gray-700 hover:bg-gray-100"
            >
              <Users className="w-4 h-4 mr-2" />
              All team members
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 h-auto text-sm text-gray-700 hover:bg-gray-100"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-indigo-500 text-white text-sm">
                YN
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Your Name</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}