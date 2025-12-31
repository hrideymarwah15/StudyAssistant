"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { useLoading } from '@/components/ui/loading'
import {
  getTasks, updateTask, createTask, deleteTask, toggleSubtask,
  getStudyTasks, createStudyTask, toggleTaskComplete, deleteStudyTask,
  type Task, type StudyTask
} from '@/lib/firestore'

interface TaskState {
  tasks: Task[]
  studyTasks: { [planId: string]: StudyTask[] }
  loading: boolean
  saving: boolean
  error: string | null
}

interface OptimisticUpdate {
  id: string
  type: 'task' | 'studyTask'
  planId?: string
  previousState: any
  newState: any
}

export function usePersistentTasks() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { setLoading } = useLoading()
  const [state, setState] = useState<TaskState>({
    tasks: [],
    studyTasks: {},
    loading: true,
    saving: false,
    error: null
  })

  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([])

  // Load all tasks on mount
  useEffect(() => {
    if (!user) return

    const loadTasks = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        const regularTasks = await getTasks(user.uid)
        setState(prev => ({
          ...prev,
          tasks: regularTasks,
          loading: false
        }))
      } catch (error) {
        console.error('Error loading tasks:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load tasks'
        }))
      }
    }

    loadTasks()
  }, [user])

  // Load study tasks for a specific plan
  const loadStudyTasks = useCallback(async (planId: string) => {
    if (!user) return

    try {
      const tasks = await getStudyTasks(user.uid, planId)
      setState(prev => ({
        ...prev,
        studyTasks: { ...prev.studyTasks, [planId]: tasks }
      }))
    } catch (error) {
      console.error('Error loading study tasks:', error)
      setState(prev => ({ ...prev, error: 'Failed to load study tasks' }))
    }
  }, [user])

  // Optimistic update helper
  const optimisticUpdate = useCallback(async (
    updateFn: () => Promise<void>,
    optimisticChange: () => void,
    rollbackChange: () => void,
    updateId: string,
    updateType: 'task' | 'studyTask',
    planId?: string
  ) => {
    // Apply optimistic change
    optimisticChange()
    setState(prev => ({ ...prev, saving: true, error: null }))
    setLoading(true, 'Saving...')

    try {
      await updateFn()
      setState(prev => ({ ...prev, saving: false }))
      setLoading(false)
      toast({
        title: "Success",
        description: "Changes saved successfully",
        variant: "success"
      })
    } catch (error) {
      console.error('Error saving task:', error)

      // Rollback optimistic change
      rollbackChange()
      setState(prev => ({
        ...prev,
        saving: false,
        error: 'Failed to save changes'
      }))
      setLoading(false)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      })
    }
  }, [toast, setLoading])

  // Task completion toggle with optimistic updates
  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    const task = state.tasks.find((t: Task) => t.id === taskId)
    if (!task) return

    const previousTask = { ...task }
    const updatedTask: Task = { ...task, status: completed ? 'done' : 'todo' }

    await optimisticUpdate(
      () => updateTask(taskId, { status: updatedTask.status as Task['status'] }),
      () => setState(prev => ({
        ...prev,
        tasks: prev.tasks.map((t: Task) => t.id === taskId ? updatedTask : t)
      })),
      () => setState(prev => ({
        ...prev,
        tasks: prev.tasks.map((t: Task) => t.id === taskId ? previousTask : t)
      })),
      taskId,
      'task'
    )
  }, [state.tasks, optimisticUpdate])

  // Study task completion toggle
  const toggleStudyTask = useCallback(async (taskId: string, completed: boolean, planId: string) => {
    const planTasks = state.studyTasks[planId] || []
    const task = planTasks.find((t: StudyTask) => t.id === taskId)
    if (!task) return

    const previousTask = { ...task }
    const updatedTask = { ...task, completed }

    await optimisticUpdate(
      () => toggleTaskComplete(taskId, completed, planId),
      () => setState(prev => ({
        ...prev,
        studyTasks: {
          ...prev.studyTasks,
          [planId]: prev.studyTasks[planId]?.map((t: StudyTask) => t.id === taskId ? updatedTask : t) || []
        }
      })),
      () => setState(prev => ({
        ...prev,
        studyTasks: {
          ...prev.studyTasks,
          [planId]: prev.studyTasks[planId]?.map((t: StudyTask) => t.id === taskId ? previousTask : t) || []
        }
      })),
      taskId,
      'studyTask',
      planId
    )
  }, [state.studyTasks, optimisticUpdate])

  // Create new task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return

    const tempId = `temp-${Date.now()}`
    const tempTask: Task = {
      id: tempId,
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Optimistic add
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, tempTask],
      saving: true
    }))

    try {
      const realId = await createTask(taskData)
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map((t: Task) => t.id === tempId ? { ...t, id: realId } : t),
        saving: false
      }))
    } catch (error) {
      console.error('Error creating task:', error)
      // Remove temp task on error
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter((t: Task) => t.id !== tempId),
        saving: false,
        error: 'Failed to create task'
      }))
    }
  }, [user])

  // Delete task
  const removeTask = useCallback(async (taskId: string) => {
    const task = state.tasks.find((t: Task) => t.id === taskId)
    if (!task) return

    // Optimistic remove
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter((t: Task) => t.id !== taskId),
      saving: true
    }))

    try {
      await deleteTask(taskId)
      setState(prev => ({ ...prev, saving: false }))
    } catch (error) {
      console.error('Error deleting task:', error)
      // Restore task on error
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, task],
        saving: false,
        error: 'Failed to delete task'
      }))
    }
  }, [state.tasks])

  return {
    ...state,
    loadStudyTasks,
    toggleTask,
    toggleStudyTask,
    addTask,
    removeTask
  }
}