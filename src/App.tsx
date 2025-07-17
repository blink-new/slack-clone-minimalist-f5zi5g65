import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { Menu, X } from 'lucide-react'
import { Button } from './components/ui/button'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState('general')
  const [selectedDM, setSelectedDM] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId)
    setSelectedDM('')
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  const handleDMSelect = (dmId: string) => {
    setSelectedDM(dmId)
    setSelectedChannel('')
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Welcome to Team Workspace</h1>
          <p className="text-gray-600 mb-6">Please sign in to continue</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const getChannelName = (channelId: string) => {
    const channelNames: Record<string, string> = {
      general: 'general',
      random: 'random',
      announcements: 'announcements',
      development: 'development',
      design: 'design'
    }
    return channelNames[channelId] || channelId
  }

  const getDMName = (dmId: string) => {
    const dmNames: Record<string, string> = {
      john: 'John Doe',
      sarah: 'Sarah Wilson',
      mike: 'Mike Johnson',
      emma: 'Emma Davis'
    }
    return dmNames[dmId] || dmId
  }

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          selectedDM={selectedDM}
          onDMSelect={handleDMSelect}
        />
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          selectedDM={selectedDM}
          onDMSelect={handleDMSelect}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-black">Team Workspace</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
        
        <ChatArea
          channelId={selectedChannel}
          dmId={selectedDM}
          channelName={selectedChannel ? getChannelName(selectedChannel) : undefined}
          dmName={selectedDM ? getDMName(selectedDM) : undefined}
        />
      </div>
    </div>
  )
}

export default App