"use client"

export interface ParsedCommand {
  intent: string
  entities: Record<string, any>
  confidence: number
  originalCommand: string
  requiresConfirmation?: boolean
  multiStep?: boolean
  steps?: CommandStep[]
}

export interface CommandStep {
  id: string
  action: string
  params: Record<string, any>
  description: string
  dependsOn?: string[]
  requiresUserInput?: boolean
}

export interface CommandContext {
  userId: string
  currentPage?: string
  recentActions?: string[]
  userPreferences?: Record<string, any>
  availableData?: {
    tasks?: any[]
    courses?: any[]
    habits?: any[]
    materials?: any[]
  }
}

export class JarvisCommandParser {
  private readonly COMMAND_PATTERNS = {
    // Task Management
    create_task: [
      /(?:create|add|make|schedule)\s+(?:a\s+)?(?:new\s+)?task(?:\s+(?:called|named|titled)\s+)?["']?([^"']+)["']?/i,
      /(?:i\s+need\s+to|i\s+have\s+to|i\s+should)\s+(.+?)(?:\s+(?:by|before|due)\s+(.+?))?(?:\s+(?:for|in)\s+(.+?))?$/i,
      /(?:remind\s+me\s+to|don't\s+forget\s+to)\s+(.+?)(?:\s+(?:by|before|due)\s+(.+?))?$/i
    ],

    complete_task: [
      /(?:complete|finish|mark\s+(?:as\s+)?done|check\s+off)\s+(?:task\s+)?["']?([^"']+)["']?/i,
      /(?:i\s+(?:finished|completed|done\s+with))\s+(.+)$/i
    ],

    show_tasks: [
      /(?:show|list|display|get)\s+(?:me\s+)?(?:my\s+)?tasks?(?:\s+(?:for|in)\s+(.+?))?(?:\s+(?:due|before)\s+(.+?))?/i,
      /(?:what\s+(?:do\s+i\s+have\s+to\s+do|tasks\s+do\s+i\s+have|is\s+on\s+my\s+plate))\??$/i,
      /(?:what's\s+(?:due|coming\s+up|on\s+my\s+schedule))\??$/i
    ],

    // Study Sessions
    start_study: [
      /(?:start|begin|launch)\s+(?:a\s+)?(?:study|focus|work)\s+session(?:\s+(?:for|on)\s+(.+?))?(?:\s+(?:of|lasting)\s+(\d+)\s*(?:min|minutes?))?/i,
      /(?:let's\s+(?:study|focus|work))\s*(?:\s+(?:on|for)\s+(.+?))?(?:\s+(?:for|lasting)\s+(\d+)\s*(?:min|minutes?))?/i,
      /(?:time\s+to\s+(?:study|focus|work))\s*(?:\s+(?:on|for)\s+(.+?))?(?:\s+(?:for|lasting)\s+(\d+)\s*(?:min|minutes?))?/i
    ],

    // Habit Tracking
    complete_habit: [
      /(?:i\s+(?:did|completed?|finished))\s+(.+?)(?:\s+today)?$/i,
      /(?:mark|check)\s+(.+?)\s+(?:as\s+)?(?:done|completed?)(?:\s+today)?$/i,
      /(?:completed?|finished|did)\s+(.+?)(?:\s+habit)?(?:\s+today)?$/i
    ],

    show_habits: [
      /(?:show|list|display)\s+(?:me\s+)?(?:my\s+)?habits?$/i,
      /(?:what\s+habits?\s+(?:do\s+i\s+have|should\s+i\s+do))\??$/i,
      /(?:habit\s+(?:tracker|status|progress))\??$/i
    ],

    // Course Management
    show_course: [
      /(?:show|tell\s+me\s+about|what's\s+up\s+with)\s+(?:my\s+)?(.+?)\s+course$/i,
      /(?:course\s+info|course\s+details)\s+(?:for\s+)?(.+)$/i,
      /(?:how's\s+my\s+)?(.+?)\s+(?:course|class)\s+(?:going|progress)\??$/i
    ],

    // Materials
    find_material: [
      /(?:find|search|get|show)\s+(?:me\s+)?(?:materials?|notes?|resources?)(?:\s+(?:for|about|on)\s+(.+?))?(?:\s+(?:in|from)\s+(.+?))?/i,
      /(?:where\s+(?:are|is)\s+my\s+)?(.+?)\s+(?:notes?|materials?|resources?)\??$/i,
      /(?:i\s+need\s+(?:materials?|notes?|resources?)\s+(?:for|about|on)\s+)?(.+)$/i
    ],

    // Scheduling
    schedule_event: [
      /(?:schedule|plan|set\s+up)\s+(?:a\s+)?(?:meeting|event|appointment)(?:\s+(?:called|named|titled)\s+["']?([^"']+)["']?)?(?:\s+(?:for|on|at)\s+(.+?))?(?:\s+(?:with|and)\s+(.+?))?/i,
      /(?:add\s+to\s+(?:my\s+)?calendar|put\s+on\s+(?:my\s+)?schedule)\s+(.+?)(?:\s+(?:at|on)\s+(.+?))?(?:\s+(?:with|and)\s+(.+?))?/i
    ],

    // Analytics
    show_progress: [
      /(?:show|tell\s+me|get)\s+(?:my\s+)?(?:progress|stats|analytics|performance)(?:\s+(?:for|on|in)\s+(.+?))?(?:\s+(?:this\s+)?(?:week|month|year))?/i,
      /(?:how\s+(?:am\s+i\s+doing|is\s+my\s+progress|are\s+my\s+stats))\??(?:\s+(?:in|for|on)\s+(.+?))?/i,
      /(?:progress\s+report|study\s+stats|performance\s+summary)(?:\s+(?:for|on)\s+(.+?))?\??$/i
    ],

    // Multi-step Commands
    study_plan: [
      /(?:create|make|plan|generate)\s+(?:a\s+)?(?:study|revision|exam)\s+plan(?:\s+(?:for|exam)\s+(.+?))?(?:\s+(?:in|over)\s+(\d+)\s*(?:days?|weeks?))?/i,
      /(?:help\s+me\s+)?(?:plan|prepare)\s+(?:for\s+)?(?:my\s+)?(.+?)\s+(?:exam|test|quiz)(?:\s+(?:in|over)\s+(\d+)\s*(?:days?|weeks?))?/i
    ],

    productivity_session: [
      /(?:start|begin|launch)\s+(?:a\s+)?(?:productivity|deep\s+work|focus)\s+session(?:\s+(?:for|lasting)\s+(\d+)\s*(?:min|minutes?|hours?))?/i,
      /(?:let's\s+(?:get|be)\s+productive|time\s+for\s+deep\s+work|focus\s+mode|do\s+not\s+disturb)$/i
    ]
  }

  private readonly INTENT_MAPPING = {
    create_task: 'task.create',
    complete_task: 'task.complete',
    show_tasks: 'task.list',
    start_study: 'study.start',
    complete_habit: 'habit.complete',
    show_habits: 'habit.list',
    show_course: 'course.info',
    find_material: 'material.search',
    schedule_event: 'calendar.create',
    show_progress: 'analytics.show',
    study_plan: 'plan.create',
    productivity_session: 'productivity.start'
  }

  parseCommand(command: string, context?: CommandContext): ParsedCommand {
    const normalizedCommand = command.toLowerCase().trim()

    // Try to match against patterns
    for (const [intentKey, patterns] of Object.entries(this.COMMAND_PATTERNS)) {
      for (const pattern of patterns) {
        const match = normalizedCommand.match(pattern)
        if (match) {
          const parsed = this.buildParsedCommand(intentKey, match, command)
          if (parsed.confidence > 0.3) {
            // Add multi-step logic if needed
            if (parsed.multiStep) {
              parsed.steps = this.generateSteps(parsed, context)
            }
            return parsed
          }
        }
      }
    }

    // Fallback to generic command
    return {
      intent: 'unknown',
      entities: {},
      confidence: 0.1,
      originalCommand: command,
      requiresConfirmation: true
    }
  }

  private buildParsedCommand(intentKey: string, match: RegExpMatchArray, originalCommand: string): ParsedCommand {
    const intent = this.INTENT_MAPPING[intentKey as keyof typeof this.INTENT_MAPPING] || intentKey
    const entities: Record<string, any> = {}
    let confidence = 0.8

    switch (intentKey) {
      case 'create_task':
        entities.title = match[1] || match[2] || match[3]
        entities.dueDate = this.parseDate(match[4] || match[5])
        entities.course = match[6]
        break

      case 'complete_task':
        entities.taskName = match[1] || match[2]
        break

      case 'show_tasks':
        entities.filter = match[1] || match[2] ? { course: match[1], dueDate: match[2] } : null
        break

      case 'start_study':
        entities.task = match[1] || match[2]
        entities.duration = match[3] || match[4] ? parseInt(match[3] || match[4]) : 25
        break

      case 'complete_habit':
        entities.habitName = match[1] || match[2] || match[3]
        break

      case 'show_course':
        entities.courseName = match[1] || match[2] || match[3]
        break

      case 'find_material':
        entities.topic = match[1] || match[2] || match[3]
        entities.course = match[4]
        break

      case 'schedule_event':
        entities.title = match[1] || match[4]
        entities.dateTime = this.parseDate(match[2] || match[5])
        entities.participants = match[3] || match[6]
        break

      case 'study_plan':
        entities.examName = match[1] || match[2]
        entities.days = match[3] || match[4] ? parseInt(match[3] || match[4]) : 7
        confidence = 0.9
        break

      case 'productivity_session':
        entities.duration = match[1] ? this.parseDuration(match[1]) : 90
        confidence = 0.9
        break

      default:
        confidence = 0.5
    }

    return {
      intent,
      entities,
      confidence,
      originalCommand,
      multiStep: ['study_plan', 'productivity_session'].includes(intentKey),
      requiresConfirmation: confidence < 0.7
    }
  }

  private generateSteps(parsed: ParsedCommand, context?: CommandContext): CommandStep[] {
    const steps: CommandStep[] = []

    switch (parsed.intent) {
      case 'plan.create':
        steps.push(
          {
            id: 'gather_requirements',
            action: 'analyze_course_materials',
            params: { examName: parsed.entities.examName },
            description: 'Analyzing course materials and syllabus'
          },
          {
            id: 'assess_current_progress',
            action: 'check_completion_status',
            params: { course: parsed.entities.examName },
            description: 'Checking current progress and completed topics'
          },
          {
            id: 'calculate_study_load',
            action: 'estimate_time_needed',
            params: { days: parsed.entities.days, course: parsed.entities.examName },
            description: 'Calculating optimal study time distribution'
          },
          {
            id: 'generate_schedule',
            action: 'create_study_plan',
            params: { days: parsed.entities.days, course: parsed.entities.examName },
            description: 'Creating detailed study schedule',
            dependsOn: ['gather_requirements', 'assess_current_progress', 'calculate_study_load']
          },
          {
            id: 'create_tasks',
            action: 'schedule_tasks',
            params: { planId: '{{generate_schedule.result}}' },
            description: 'Adding study tasks to your planner',
            dependsOn: ['generate_schedule']
          }
        )
        break

      case 'productivity.start':
        steps.push(
          {
            id: 'prepare_environment',
            action: 'setup_focus_mode',
            params: { duration: parsed.entities.duration },
            description: 'Setting up distraction-free environment'
          },
          {
            id: 'select_task',
            action: 'choose_next_task',
            params: {},
            description: 'Selecting the most important task to focus on',
            requiresUserInput: true
          },
          {
            id: 'start_timer',
            action: 'begin_pomodoro',
            params: { taskId: '{{select_task.result}}', duration: parsed.entities.duration },
            description: 'Starting focused work session',
            dependsOn: ['prepare_environment', 'select_task']
          },
          {
            id: 'monitor_progress',
            action: 'track_session',
            params: { sessionId: '{{start_timer.result}}' },
            description: 'Monitoring your progress and providing encouragement'
          }
        )
        break
    }

    return steps
  }

  private parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null

    // Simple date parsing - could be enhanced with a proper date library
    const today = new Date()
    const lowerStr = dateStr.toLowerCase()

    if (lowerStr.includes('tomorrow')) {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return tomorrow
    }

    if (lowerStr.includes('next week')) {
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      return nextWeek
    }

    if (lowerStr.includes('end of week') || lowerStr.includes('friday')) {
      const friday = new Date(today)
      const daysUntilFriday = (5 - today.getDay() + 7) % 7
      friday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday))
      return friday
    }

    // Try to parse as a specific date
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }

    return null
  }

  private parseDuration(durationStr: string): number {
    const match = durationStr.match(/(\d+)\s*(min|minutes?|hours?)/i)
    if (match) {
      const value = parseInt(match[1])
      const unit = match[2].toLowerCase()
      return unit.startsWith('hour') ? value * 60 : value
    }
    return 25 // Default 25 minutes
  }

  // Utility method to get suggested commands based on context
  getSuggestedCommands(context?: CommandContext): string[] {
    const suggestions: string[] = []

    if (context?.currentPage === 'dashboard') {
      suggestions.push(
        "Start a study session",
        "Show my tasks",
        "Complete a habit",
        "Create a study plan"
      )
    }

    if (context?.currentPage === 'planner') {
      suggestions.push(
        "Create a new task",
        "Show tasks due today",
        "Schedule an event"
      )
    }

    if (context?.availableData?.tasks && context.availableData.tasks.length > 0) {
      suggestions.push("Show my tasks")
    }

    if (context?.availableData?.habits && context.availableData.habits.length > 0) {
      suggestions.push("Show my habits")
    }

    return suggestions.slice(0, 4) // Return top 4 suggestions
  }
}

// Singleton instance
let commandParser: JarvisCommandParser | null = null

export function getCommandParser(): JarvisCommandParser {
  if (!commandParser) {
    commandParser = new JarvisCommandParser()
  }
  return commandParser
}