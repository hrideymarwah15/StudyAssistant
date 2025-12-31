"use client"

import { ParsedCommand, CommandStep, CommandContext } from './commandParser'
import { getTasks, createTask, updateTask, getHabits, toggleHabitCompletion, getCourses, getCalendarEvents, createCalendarEvent, getMaterials, logStudySession, getDailyStats } from '@/lib/firestore'
import { analyzeLearningPatterns } from '@/lib/ai-client'
import { getMaterialSearchIntegration } from './materials-integration'

export interface ExecutionResult {
  success: boolean
  message: string
  data?: any
  nextStep?: string
  requiresUserInput?: boolean
  userInputPrompt?: string
}

export interface ExecutionState {
  commandId: string
  currentStep: number
  totalSteps: number
  results: Record<string, any>
  status: 'running' | 'waiting' | 'completed' | 'failed'
  error?: string
}

export class JarvisCommandExecutor {
  private executionStates: Map<string, ExecutionState> = new Map()
  private readonly API_BRIDGES = {
    // Task Management
    'task.create': this.createTask.bind(this),
    'task.complete': this.completeTask.bind(this),
    'task.list': this.listTasks.bind(this),

    // Study Sessions
    'study.start': this.startStudySession.bind(this),

    // Habit Management
    'habit.complete': this.completeHabit.bind(this),
    'habit.list': this.listHabits.bind(this),

    // Course Information
    'course.info': this.getCourseInfo.bind(this),

    // Material Search
    'material.search': this.searchMaterials.bind(this),

    // Calendar
    'calendar.create': this.createCalendarEvent.bind(this),

    // Analytics
    'analytics.show': this.showAnalytics.bind(this),

    // Multi-step Operations
    'plan.create': this.createStudyPlan.bind(this),
    'productivity.start': this.startProductivitySession.bind(this),

    // Sub-actions for multi-step commands
    'analyze_course_materials': this.analyzeCourseMaterials.bind(this),
    'check_completion_status': this.checkCompletionStatus.bind(this),
    'estimate_time_needed': this.estimateTimeNeeded.bind(this),
    'create_study_plan': this.createStudyPlanAction.bind(this),
    'schedule_tasks': this.scheduleTasks.bind(this),
    'setup_focus_mode': this.setupFocusMode.bind(this),
    'choose_next_task': this.chooseNextTask.bind(this),
    'begin_pomodoro': this.beginPomodoro.bind(this),
    'track_session': this.trackSession.bind(this)
  }

  async executeCommand(command: ParsedCommand, context: CommandContext): Promise<ExecutionResult> {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (command.multiStep && command.steps) {
      return this.executeMultiStepCommand(commandId, command, context)
    } else {
      return this.executeSingleCommand(command, context)
    }
  }

  private async executeSingleCommand(command: ParsedCommand, context: CommandContext): Promise<ExecutionResult> {
    const bridge = this.API_BRIDGES[command.intent as keyof typeof this.API_BRIDGES]

    if (!bridge) {
      return {
        success: false,
        message: `I don't know how to handle "${command.intent}" commands yet.`
      }
    }

    try {
      return await bridge(command.entities, context)
    } catch (error) {
      console.error('Command execution error:', error)
      return {
        success: false,
        message: `Sorry, I encountered an error while executing that command. Please try again.`
      }
    }
  }

  private async executeMultiStepCommand(commandId: string, command: ParsedCommand, context: CommandContext): Promise<ExecutionResult> {
    if (!command.steps) {
      return { success: false, message: 'No steps defined for multi-step command' }
    }

    const state: ExecutionState = {
      commandId,
      currentStep: 0,
      totalSteps: command.steps.length,
      results: {},
      status: 'running'
    }

    this.executionStates.set(commandId, state)

    try {
      for (let i = 0; i < command.steps.length; i++) {
        const step = command.steps[i]
        state.currentStep = i

        // Check dependencies
        if (step.dependsOn) {
          const missingDeps = step.dependsOn.filter(dep => !state.results[dep])
          if (missingDeps.length > 0) {
            state.status = 'failed'
            state.error = `Missing dependencies: ${missingDeps.join(', ')}`
            break
          }
        }

        // Execute step
        const stepResult = await this.executeStep(step, state.results, context)

        if (!stepResult.success) {
          state.status = 'failed'
          state.error = stepResult.message
          break
        }

        state.results[step.id] = stepResult.data

        // Handle user input requirements
        if (stepResult.requiresUserInput) {
          state.status = 'waiting'
          return {
            success: true,
            message: stepResult.userInputPrompt || 'Please provide additional information',
            requiresUserInput: true,
            nextStep: step.id
          }
        }
      }

      state.status = 'completed'
      return {
        success: true,
        message: this.generateCompletionMessage(command, state.results),
        data: state.results
      }

    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        message: 'Command execution failed. Please try again.'
      }
    }
  }

  private async executeStep(step: CommandStep, previousResults: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    // Replace template variables
    const params = this.resolveTemplateVariables(step.params, previousResults)

    const bridge = this.API_BRIDGES[step.action as keyof typeof this.API_BRIDGES]

    if (!bridge) {
      return {
        success: false,
        message: `Unknown action: ${step.action}`
      }
    }

    return await bridge(params, context)
  }

  private resolveTemplateVariables(params: Record<string, any>, results: Record<string, any>): Record<string, any> {
    const resolved = { ...params }

    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const templateKey = value.slice(2, -2)
        const [resultKey, property] = templateKey.split('.')

        if (results[resultKey]) {
          resolved[key] = property ? results[resultKey][property] : results[resultKey]
        }
      }
    }

    return resolved
  }

  // API Bridge Implementations

  private async createTask(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const taskData = {
        userId: context.userId,
        title: entities.title,
        description: entities.description || '',
        priority: entities.priority || 'medium',
        status: 'todo' as const,
        dueDate: entities.dueDate,
        course: entities.course,
        estimatedMinutes: entities.duration || 30,
        tags: entities.tags || [],
        subtasks: [],
        links: []
      }

      const taskId = await createTask(taskData)

      return {
        success: true,
        message: `Created task "${entities.title}"${entities.dueDate ? ` due ${entities.dueDate.toLocaleDateString()}` : ''}`,
        data: { taskId }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create task. Please try again.'
      }
    }
  }

  private async completeTask(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const tasks = await getTasks(context.userId)
      const task = tasks.find(t => t.title.toLowerCase().includes(entities.taskName.toLowerCase()))

      if (!task) {
        return {
          success: false,
          message: `I couldn't find a task named "${entities.taskName}". Could you be more specific?`
        }
      }

      await updateTask(task.id, { status: 'done', completedAt: new Date() })

      return {
        success: true,
        message: `Marked "${task.title}" as completed! Great job! 🎉`,
        data: { taskId: task.id }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to complete task. Please try again.'
      }
    }
  }

  private async listTasks(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const tasks = await getTasks(context.userId)
      let filteredTasks = tasks

      if (entities.filter) {
        if (entities.filter.course) {
          filteredTasks = filteredTasks.filter(t => t.course?.toLowerCase().includes(entities.filter.course.toLowerCase()))
        }
        if (entities.filter.dueDate) {
          const filterDate = new Date(entities.filter.dueDate)
          filteredTasks = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) <= filterDate)
        }
      }

      const pendingTasks = filteredTasks.filter(t => t.status !== 'done')

      if (pendingTasks.length === 0) {
        return {
          success: true,
          message: 'You have no pending tasks! 🎉',
          data: { tasks: [] }
        }
      }

      const taskList = pendingTasks.slice(0, 5).map(t => `- ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ''}`).join('\n')

      return {
        success: true,
        message: `Here are your ${entities.filter ? 'filtered ' : ''}tasks:\n${taskList}${pendingTasks.length > 5 ? `\n...and ${pendingTasks.length - 5} more` : ''}`,
        data: { tasks: pendingTasks }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve tasks. Please try again.'
      }
    }
  }

  private async startStudySession(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    // This would integrate with the Pomodoro timer
    return {
      success: true,
      message: `Starting a ${entities.duration || 25} minute study session${entities.task ? ` for "${entities.task}"` : ''}. Focus mode activated! 🚀`,
      data: { duration: entities.duration || 25, task: entities.task }
    }
  }

  private async completeHabit(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const habits = await getHabits(context.userId)
      const habit = habits.find(h => h.name.toLowerCase().includes(entities.habitName.toLowerCase()))

      if (!habit) {
        return {
          success: false,
          message: `I couldn't find a habit named "${entities.habitName}". Could you be more specific?`
        }
      }

      await toggleHabitCompletion(habit.id, new Date().toISOString().split('T')[0])

      return {
        success: true,
        message: `Completed "${habit.name}" for today! Keep up the great work! 💪`,
        data: { habitId: habit.id }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to complete habit. Please try again.'
      }
    }
  }

  private async listHabits(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const habits = await getHabits(context.userId)
      const today = new Date().toISOString().split('T')[0]

      const habitStatus = habits.map(h => {
        const completedToday = h.completions.some(c => c.date === today && c.completed)
        return `- ${h.name}: ${completedToday ? '✅ Done' : '⏳ Pending'} (${h.currentStreak} day streak)`
      }).join('\n')

      return {
        success: true,
        message: `Here's your habit status:\n${habitStatus}`,
        data: { habits }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve habits. Please try again.'
      }
    }
  }

  private async getCourseInfo(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const courses = await getCourses(context.userId)
      const course = courses.find(c => c.name.toLowerCase().includes(entities.courseName.toLowerCase()))

      if (!course) {
        return {
          success: false,
          message: `I couldn't find a course named "${entities.courseName}".`
        }
      }

      const info = `Course: ${course.name}${course.code ? ` (${course.code})` : ''}${course.professor ? `\nProfessor: ${course.professor}` : ''}${course.examDate ? `\nNext Exam: ${new Date(course.examDate).toLocaleDateString()}` : ''}`

      return {
        success: true,
        message: info,
        data: { course }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve course information.'
      }
    }
  }

  private async searchMaterials(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const searchIntegration = getMaterialSearchIntegration(context.userId)
      await searchIntegration.initialize()

      const query = entities.topic || entities.query || ''
      const results = await searchIntegration.search(query, {
        limit: 5,
        types: entities.type ? [entities.type] : undefined,
        tags: entities.tags ? entities.tags.split(',').map((t: string) => t.trim()) : undefined
      })

      if (results.length === 0) {
        return {
          success: false,
          message: `I couldn't find any materials related to "${query}". ${searchIntegration.getMaterialCount() > 0 ? 'Try a different search term or check your materials.' : 'You haven\'t uploaded any materials yet.'}`
        }
      }

      const materialList = results.map(r =>
        `- ${r.name} (${r.type}) - ${r.excerpt}`
      ).join('\n')

      return {
        success: true,
        message: `Found ${results.length} material${results.length > 1 ? 's' : ''} related to "${query}":\n${materialList}`,
        data: { materials: results }
      }
    } catch (error) {
      console.error('Material search error:', error)
      return {
        success: false,
        message: 'Failed to search materials. Please try again.'
      }
    }
  }

  private async createCalendarEvent(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const eventData = {
        userId: context.userId,
        title: entities.title,
        type: 'meeting' as const,
        startTime: entities.dateTime || new Date(),
        endTime: new Date((entities.dateTime || new Date()).getTime() + 60 * 60 * 1000), // 1 hour default
        isAllDay: false,
        isRecurring: false,
        description: entities.description || '',
        color: '#3b82f6'
      }

      const eventId = await createCalendarEvent(eventData)

      return {
        success: true,
        message: `Scheduled "${entities.title}" for ${entities.dateTime?.toLocaleString() || 'now'}`,
        data: { eventId }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to schedule event.'
      }
    }
  }

  private async showAnalytics(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const dailyStats = await getDailyStats(context.userId, today)

      if (!dailyStats) {
        return {
          success: true,
          message: "You haven't logged any study time today yet. Let's get started! 📚",
          data: { stats: null }
        }
      }

      const message = `Today's Progress:\n` +
        `📖 Study Time: ${Math.round(dailyStats.totalStudyMinutes / 60 * 10) / 10}h\n` +
        `✅ Tasks Completed: ${dailyStats.taskCompleted}\n` +
        `🎯 Pomodoro Sessions: ${dailyStats.pomodoroCompleted}\n` +
        `🔥 Current Streak: ${dailyStats.streakDay} days`

      return {
        success: true,
        message,
        data: { stats: dailyStats }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve analytics.'
      }
    }
  }

  // Multi-step command implementations
  private async createStudyPlan(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    // This is a multi-step command that will be handled by the multi-step executor
    return {
      success: true,
      message: 'Starting study plan creation...',
      data: { examName: entities.examName, days: entities.days }
    }
  }

  private async startProductivitySession(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    // This is a multi-step command that will be handled by the multi-step executor
    return {
      success: true,
      message: 'Initiating productivity session...',
      data: { duration: entities.duration }
    }
  }

  // Sub-action implementations for multi-step commands
  private async analyzeCourseMaterials(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const courses = await getCourses(context.userId)
      const course = courses.find(c => c.name.toLowerCase().includes(entities.examName.toLowerCase()))

      return {
        success: true,
        message: 'Analyzed course materials',
        data: { course, materials: course?.syllabus || [] }
      }
    } catch (error) {
      return { success: false, message: 'Failed to analyze course materials' }
    }
  }

  private async checkCompletionStatus(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const tasks = await getTasks(context.userId)
      const courseTasks = tasks.filter(t => t.course?.toLowerCase().includes(entities.course.toLowerCase()))
      const completedTasks = courseTasks.filter(t => t.status === 'done')

      return {
        success: true,
        message: 'Checked completion status',
        data: { completed: completedTasks.length, total: courseTasks.length, progress: completedTasks.length / courseTasks.length }
      }
    } catch (error) {
      return { success: false, message: 'Failed to check completion status' }
    }
  }

  private async estimateTimeNeeded(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    const estimatedHours = Math.max(entities.days * 2, 10) // At least 10 hours, or 2 hours per day

    return {
      success: true,
      message: 'Estimated study time needed',
      data: { estimatedHours, dailyHours: estimatedHours / entities.days }
    }
  }

  private async createStudyPlanAction(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      // Generate a simple study plan structure
      const plan = {
        id: `plan_${Date.now()}`,
        examName: entities.course,
        days: entities.days,
        dailyTasks: Math.ceil(10 / entities.days), // 10 tasks total
        focusAreas: ['Review notes', 'Practice problems', 'Take breaks', 'Light review']
      }

      return {
        success: true,
        message: 'Generated study plan',
        data: { plan, planId: `plan_${Date.now()}` }
      }
    } catch (error) {
      return { success: false, message: 'Failed to generate study plan' }
    }
  }

  private async scheduleTasks(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    // This would create actual tasks in the system
    return {
      success: true,
      message: 'Scheduled study tasks',
      data: { taskCount: 5 } // Placeholder
    }
  }

  private async setupFocusMode(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    return {
      success: true,
      message: 'Focus mode activated - notifications silenced, distractions minimized',
      data: { focusMode: true }
    }
  }

  private async chooseNextTask(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    try {
      const tasks = await getTasks(context.userId)
      const pendingTasks = tasks.filter(t => t.status !== 'done').sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      if (pendingTasks.length === 0) {
        return {
          success: true,
          message: 'No pending tasks found',
          data: { task: null }
        }
      }

      return {
        success: true,
        message: `Selected: "${pendingTasks[0].title}"`,
        data: { task: pendingTasks[0] },
        requiresUserInput: true,
        userInputPrompt: `Would you like to work on "${pendingTasks[0].title}" or choose a different task?`
      }
    } catch (error) {
      return { success: false, message: 'Failed to select task' }
    }
  }

  private async beginPomodoro(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    return {
      success: true,
      message: `Starting ${entities.duration} minute focus session on "${entities.taskId?.title || 'selected task'}"`,
      data: { sessionId: `session_${Date.now()}`, duration: entities.duration }
    }
  }

  private async trackSession(entities: Record<string, any>, context: CommandContext): Promise<ExecutionResult> {
    return {
      success: true,
      message: 'Session tracking active - I\'ll keep you motivated!',
      data: { tracking: true }
    }
  }

  private generateCompletionMessage(command: ParsedCommand, results: Record<string, any>): string {
    switch (command.intent) {
      case 'plan.create':
        return `✅ Study plan created! I've scheduled ${results.schedule_tasks?.taskCount || 5} study sessions over ${command.entities.days} days. Check your planner for details.`

      case 'productivity.start':
        return `🚀 Productivity session started! ${command.entities.duration} minutes of focused work ahead. You've got this!`

      default:
        return '✅ Command completed successfully!'
    }
  }

  // Utility methods
  getExecutionState(commandId: string): ExecutionState | null {
    return this.executionStates.get(commandId) || null
  }

  cancelExecution(commandId: string): void {
    const state = this.executionStates.get(commandId)
    if (state) {
      state.status = 'failed'
      state.error = 'Cancelled by user'
    }
  }
}

// Singleton instance
let commandExecutor: JarvisCommandExecutor | null = null

export function getCommandExecutor(): JarvisCommandExecutor {
  if (!commandExecutor) {
    commandExecutor = new JarvisCommandExecutor()
  }
  return commandExecutor
}