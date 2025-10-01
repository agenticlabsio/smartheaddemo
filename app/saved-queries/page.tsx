"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { savedChatsColumns, savedChatsFilterOptions, type SavedChat } from "@/components/ui/saved-chats-columns"
import { 
  MessageCircle, 
  Trash2, 
  Plus, 
  Calendar, 
  MessageSquare, 
  Star,
  Search,
  Filter,
  Clock,
  Archive,
  Download,
  Share,
  MoreVertical,
  TrendingUp,
  Brain,
  FileText,
  Users,
  Activity,
  BarChart3,
  Eye,
  ArrowRight,
  Folder,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Database,
  ChartBar,
  FileSpreadsheet,
  Link2,
  Briefcase,
  GraduationCap,
  StickyNote,
  Badge as BadgeIcon,
  Info,
  Target
} from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/ui/sidebar"
import { useUser } from '@clerk/nextjs'
import { cn } from "@/lib/utils"

export default function SavedQueriesPage() {
  const { user } = useUser()
  const [savedChats, setSavedChats] = useState<SavedChat[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOption, setFilterOption] = useState('all')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedConversation, setSelectedConversation] = useState<SavedChat | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    const loadChats = async () => {
      if (user?.id) {
        try {
          const response = await fetch('/api/unified-storage/chats')
          if (response.ok) {
            const data = await response.json()
            setSavedChats(data.chats || [])
          }
        } catch (error) {
          console.error('Failed to load chats:', error)
          setSavedChats([])
        }
      }
    }
    loadChats()
  }, [user?.id])

  const deleteChat = async (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      if (user?.id) {
        try {
          const response = await fetch('/api/unified-storage/chats', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId })
          })
          if (response.ok) {
            setSavedChats(prev => prev.filter(chat => chat.id !== chatId))
          }
        } catch (error) {
          console.error('Failed to delete chat:', error)
        }
      }
    }
  }

  const toggleFavorite = (chatId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(chatId)) {
      newFavorites.delete(chatId)
    } else {
      newFavorites.add(chatId)
    }
    setFavorites(newFavorites)
  }

  const filteredChats = savedChats.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.messages?.some(msg => 
                           msg.content.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    if (filterOption === 'favorites') {
      return matchesSearch && favorites.has(chat.id)
    }
    
    return matchesSearch
  })

  const startNewChat = () => {
    window.location.href = '/chat'
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Professional Executive Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Archive className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Analytics Conversation Center</h1>
                  <p className="text-violet-100">Executive dashboard for managing analytical conversations, saved insights, and query history</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={startNewChat}
                  className="bg-white text-violet-600 hover:bg-violet-50 font-medium shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Analysis
                </Button>
              </div>
            </div>
          </div>

          {/* Professional Search and Filter Controls */}
          <Card className="p-4 mb-6 bg-white border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations, topics, or insights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm font-medium bg-white min-w-[180px]"
                  >
                    <option value="all">All Conversations</option>
                    <option value="favorites">Favorites Only</option>
                    <option value="recent">Recent (7 days)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <Button variant="outline" className="px-4 py-3 border-violet-200 text-violet-700 hover:bg-violet-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </Card>

          {/* Executive Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Total Conversations</p>
                    <p className="text-3xl font-bold text-blue-900">{savedChats.length}</p>
                    <p className="text-xs text-blue-600 mt-1">Active sessions</p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-xl">
                    <MessageCircle className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-violet-700 mb-1">Strategic Insights</p>
                    <p className="text-3xl font-bold text-violet-900">{favorites.size}</p>
                    <p className="text-xs text-violet-600 mt-1">Starred for review</p>
                  </div>
                  <div className="bg-violet-200 p-3 rounded-xl">
                    <Star className="h-6 w-6 text-violet-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Query Volume</p>
                    <p className="text-3xl font-bold text-green-900">
                      {savedChats.reduce((total, chat) => total + chat.messageCount, 0)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Messages exchanged</p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-xl">
                    <Activity className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-1">Avg. Session</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {savedChats.length > 0 
                        ? Math.round(savedChats.reduce((total, chat) => total + chat.messageCount, 0) / savedChats.length)
                        : 0
                      }
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Messages per chat</p>
                  </div>
                  <div className="bg-orange-200 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Professional Conversation Management Table */}
        {filteredChats.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm ? 'No matching analytics sessions found' : 'Your Analytics Journey Begins Here'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or filters to find the conversation you\'re looking for'
                : 'Begin your financial data analysis journey. Every conversation becomes part of your strategic intelligence library.'
              }
            </p>
            <Button onClick={startNewChat} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium px-6 py-3">
              <Plus className="h-5 w-5 mr-2" />
              {searchTerm ? 'Start New Search' : 'Begin First Analysis'}
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Conversation Archive ({filteredChats.length} sessions)
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-gray-600 border-gray-300">
                  Executive View
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedDataTable
                columns={savedChatsColumns}
                data={filteredChats}
                searchKey="title"
                placeholder="Search conversations..."
                filterableColumns={savedChatsFilterOptions}
                enableRowSelection={true}
                enableColumnVisibility={true}
                enableExport={true}
                exportFileName="saved-conversations"
                onRowClick={(chat) => {
                  setSelectedConversation(chat)
                  setIsViewDialogOpen(true)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* View Complete Conversation Modal */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-600" />
                Complete Conversation: {selectedConversation?.title}
              </DialogTitle>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {selectedConversation?.defaultMode && (
                    <div className="flex items-center gap-1">
                      {selectedConversation.defaultMode === 'executive' ? (
                        <Briefcase className="h-4 w-4 text-purple-600" />
                      ) : (
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      )}
                      <Badge variant="outline" className={`text-xs ${
                        selectedConversation.defaultMode === 'executive' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {selectedConversation.defaultMode === 'executive' ? 'Executive Mode' : 'Analyst Mode'}
                      </Badge>
                    </div>
                  )}
                  <span>{selectedConversation?.messageCount} messages</span>
                  {selectedConversation?.feedbackSummary?.totalCount > 0 && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">{selectedConversation.feedbackSummary.positiveCount}</span>
                      <ThumbsDown className="h-3 w-3 text-red-600 ml-1" />
                      <span className="text-red-600 font-medium">{selectedConversation.feedbackSummary.negativeCount}</span>
                    </div>
                  )}
                </div>
                <span>•</span>
                <span>
                  {selectedConversation?.updatedAt 
                    ? new Date(selectedConversation.updatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric', 
                        year: 'numeric'
                      })
                    : 'Unknown date'
                  }
                </span>
                {selectedConversation?.evidenceReferences?.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3 text-indigo-600" />
                      <span className="text-indigo-600 font-medium">
                        {selectedConversation.evidenceReferences.length} evidence artifacts
                      </span>
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>
            
            {/* Evidence Summary Section */}
            {selectedConversation?.evidenceReferences?.length > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-indigo-900">Evidence Summary</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedConversation.evidenceReferences.map((evidence, index) => (
                    <div key={evidence.evidenceId} className="bg-white p-2 rounded border border-indigo-100">
                      <div className="flex items-center gap-1 mb-1">
                        {evidence.evidenceType === 'sql_query' && <BarChart3 className="h-3 w-3 text-blue-600" />}
                        {evidence.evidenceType === 'data_analysis' && <ChartBar className="h-3 w-3 text-green-600" />}
                        {evidence.evidenceType === 'chart' && <BarChart3 className="h-3 w-3 text-purple-600" />}
                        {evidence.evidenceType === 'report' && <FileSpreadsheet className="h-3 w-3 text-orange-600" />}
                        <span className="text-xs font-medium text-gray-700 capitalize">{evidence.evidenceType.replace('_', ' ')}</span>
                      </div>
                      {evidence.confidenceScore && (
                        <div className="text-xs text-gray-500">
                          {Math.round(evidence.confidenceScore)}% confidence
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {selectedConversation?.messages?.map((message, index) => (
                  <div key={message.id || index} className="group">
                    {message.role === 'user' ? (
                      <div className="flex justify-end mb-4">
                        <div className="max-w-2xl">
                          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm">
                            <CardContent className="p-4">
                              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                  <span className="text-xs font-bold">You</span>
                                </div>
                                Executive Query
                              </div>
                              <div className="text-white leading-relaxed">{message.content}</div>
                              <div className="text-xs text-blue-100 mt-2 opacity-80">
                                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start mb-4">
                        <div className="max-w-3xl w-full">
                          <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <Brain className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-bold text-gray-900">LiveAgent Analysis</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      AI Response
                                    </Badge>
                                    {message.mode && (
                                      <Badge variant="outline" className={`text-xs ${
                                        message.mode === 'executive' 
                                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}>
                                        {message.mode === 'executive' ? 'Executive' : 'Analyst'}
                                      </Badge>
                                    )}
                                    {message.metadata?.executionTime && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                        {(message.metadata.executionTime / 1000).toFixed(1)}s
                                      </Badge>
                                    )}
                                    {message.metadata?.confidence && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        {Math.round(message.metadata.confidence * 100)}% confidence
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {message.feedback && (
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                                      message.feedback === 'positive' 
                                        ? 'bg-green-50 text-green-700' 
                                        : 'bg-red-50 text-red-700'
                                    }`}>
                                      {message.feedback === 'positive' ? (
                                        <ThumbsUp className="h-3 w-3" />
                                      ) : (
                                        <ThumbsDown className="h-3 w-3" />
                                      )}
                                      <span className="text-xs font-medium">
                                        {message.feedback === 'positive' ? 'Helpful' : 'Not Helpful'}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="prose prose-sm max-w-none">
                                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </div>
                              </div>
                              
                              {message.reasoning && (
                                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Brain className="h-3 w-3 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700">AI Reasoning Process</span>
                                  </div>
                                  <div className="text-xs text-gray-600 leading-relaxed">
                                    {message.reasoning}
                                  </div>
                                </div>
                              )}
                              
                              {message.sqlQuery && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">Generated SQL Query</span>
                                  </div>
                                  <code className="text-xs text-blue-800 bg-white p-2 rounded border block overflow-x-auto">
                                    {message.sqlQuery}
                                  </code>
                                </div>
                              )}
                              
                              {message.evidenceReferenceId && (
                                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Link2 className="h-3 w-3 text-indigo-600" />
                                    <span className="text-xs font-medium text-indigo-700">Evidence Reference</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs text-indigo-800 bg-white px-2 py-1 rounded border">
                                      {message.evidenceReferenceId}
                                    </code>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-800"
                                      onClick={() => {
                                        // Open evidence details - can be implemented later
                                        console.log('View evidence:', message.evidenceReferenceId)
                                      }}
                                    >
                                      View Evidence
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {selectedConversation?.messageCount} total messages
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last activity: {selectedConversation?.updatedAt 
                    ? new Date(selectedConversation.updatedAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
                {selectedConversation?.feedbackSummary?.totalCount > 0 && (
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>User Satisfaction:</span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">{selectedConversation.feedbackSummary.positiveCount}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <ThumbsDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600 font-medium">{selectedConversation.feedbackSummary.negativeCount}</span>
                    </div>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Close
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                >
                  <Link href={`/chat?restore=${selectedConversation?.id}`}>
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Resume This Conversation
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Sidebar>
  )
}