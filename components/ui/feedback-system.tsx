'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThumbsUp, ThumbsDown, MessageSquare, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackSystemProps {
  insightId: string
  className?: string
}

interface Feedback {
  rating: 'positive' | 'negative' | null
  notes: string
}

export function FeedbackSystem({ insightId, className }: FeedbackSystemProps) {
  const [feedback, setFeedback] = useState<Feedback>({ rating: null, notes: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [tempNotes, setTempNotes] = useState('')

  // Load feedback from localStorage on component mount
  useEffect(() => {
    const savedFeedback = localStorage.getItem(`feedback_${insightId}`)
    if (savedFeedback) {
      try {
        const parsed = JSON.parse(savedFeedback)
        setFeedback(parsed)
        setTempNotes(parsed.notes || '')
      } catch (error) {
        console.error('Error loading feedback:', error)
      }
    }
  }, [insightId])

  // Save feedback to localStorage
  const saveFeedback = (newFeedback: Feedback) => {
    setFeedback(newFeedback)
    localStorage.setItem(`feedback_${insightId}`, JSON.stringify(newFeedback))
  }

  const handleRatingChange = (rating: 'positive' | 'negative') => {
    const newRating = feedback.rating === rating ? null : rating
    saveFeedback({ ...feedback, rating: newRating })
  }

  const handleNotesStart = () => {
    setTempNotes(feedback.notes)
    setIsEditing(true)
  }

  const handleNotesSave = () => {
    saveFeedback({ ...feedback, notes: tempNotes })
    setIsEditing(false)
  }

  const handleNotesCancel = () => {
    setTempNotes(feedback.notes)
    setIsEditing(false)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Rating Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Helpful?</span>
        <Button
          variant={feedback.rating === 'positive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRatingChange('positive')}
          className={cn(
            "h-8 px-3",
            feedback.rating === 'positive' && "bg-green-600 hover:bg-green-700 text-white"
          )}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant={feedback.rating === 'negative' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRatingChange('negative')}
          className={cn(
            "h-8 px-3",
            feedback.rating === 'negative' && "bg-red-600 hover:bg-red-700 text-white"
          )}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Notes Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Notes
          </span>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotesStart}
              className="h-6 px-2 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              {feedback.notes ? 'Edit' : 'Add'}
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add your thoughts, questions, or additional context..."
              className="min-h-[80px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleNotesSave} className="text-xs">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleNotesCancel} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          feedback.notes && (
            <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 border-l-4 border-blue-500">
              {feedback.notes}
            </div>
          )
        )}
      </div>
    </div>
  )
}