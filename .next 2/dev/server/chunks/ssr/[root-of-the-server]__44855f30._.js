module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeKnowledgeGaps",
    ()=>analyzeKnowledgeGaps,
    "analyzeLearningPatterns",
    ()=>analyzeLearningPatterns,
    "calculateCognitiveLoad",
    ()=>calculateCognitiveLoad,
    "cn",
    ()=>cn,
    "generateSpacedRepetitionSchedule",
    ()=>generateSpacedRepetitionSchedule,
    "predictOptimalStudyTime",
    ()=>predictOptimalStudyTime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function analyzeLearningPatterns(sessions) {
    const subjectGroups = sessions.reduce((acc, session)=>{
        if (!acc[session.subject]) {
            acc[session.subject] = [];
        }
        acc[session.subject].push(session);
        return acc;
    }, {});
    return Object.entries(subjectGroups).map(([subject, subjSessions])=>{
        const scores = subjSessions.filter((s)=>s.score !== undefined).map((s)=>s.score);
        const averageScore = scores.length > 0 ? scores.reduce((a, b)=>a + b, 0) / scores.length : 0;
        const totalTime = subjSessions.reduce((sum, s)=>sum + s.duration, 0);
        const sessionsCount = subjSessions.length;
        // Find best time of day
        const hourGroups = subjSessions.reduce((acc, s)=>{
            const hour = s.date.getHours();
            if (!acc[hour]) acc[hour] = [];
            acc[hour].push(s);
            return acc;
        }, {});
        const bestHour = Object.entries(hourGroups).sort(([, a], [, b])=>b.length - a.length)[0]?.[0] || '9';
        const bestTimeOfDay = `${bestHour}:00`;
        // Calculate improvement rate
        const sortedByDate = subjSessions.filter((s)=>s.score !== undefined).sort((a, b)=>a.date.getTime() - b.date.getTime());
        let improvementRate = 0;
        if (sortedByDate.length >= 2) {
            const firstScore = sortedByDate[0].score;
            const lastScore = sortedByDate[sortedByDate.length - 1].score;
            improvementRate = (lastScore - firstScore) / (sortedByDate.length - 1);
        }
        // Recommended frequency based on current performance
        let recommendedFrequency = 3 // default
        ;
        if (averageScore > 90) recommendedFrequency = 2;
        else if (averageScore < 70) recommendedFrequency = 5;
        // Identify weak topics (mock - in real app, analyze content)
        const weakTopics = averageScore < 80 ? [
            'Fundamentals',
            'Problem solving'
        ] : [];
        return {
            subject,
            averageScore,
            totalTime,
            sessionsCount,
            bestTimeOfDay,
            improvementRate,
            recommendedFrequency,
            weakTopics
        };
    });
}
function predictOptimalStudyTime(patterns) {
    // Find most productive time across subjects
    const times = patterns.map((p)=>p.bestTimeOfDay);
    const bestDayTime = times.sort((a, b)=>times.filter((t)=>t === b).length - times.filter((t)=>t === a).length)[0] || '09:00';
    // Average recommended duration
    const avgDuration = patterns.reduce((sum, p)=>sum + p.totalTime / p.sessionsCount, 0) / patterns.length;
    const recommendedDuration = Math.max(25, Math.min(120, avgDuration)) // 25-120 min
    ;
    // Subjects needing most attention
    const subjectsToFocus = patterns.filter((p)=>p.averageScore < 85 || p.improvementRate < 2).map((p)=>p.subject).slice(0, 3);
    return {
        bestDayTime,
        recommendedDuration,
        subjectsToFocus
    };
}
function calculateCognitiveLoad(studySessions, timeWindow = 7 // days
) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
    const recentSessions = studySessions.filter((session)=>new Date(session.startTime) >= windowStart);
    // Calculate total study time in the window
    const totalStudyMinutes = recentSessions.reduce((acc, session)=>acc + session.duration, 0);
    // Calculate average focus score
    const avgFocusScore = recentSessions.length > 0 ? recentSessions.reduce((acc, session)=>acc + (session.focusScore || 80), 0) / recentSessions.length : 80;
    // Optimal study time per week (2 hours/day = 14 hours/week = 840 minutes)
    const optimalMinutes = timeWindow * 2 * 60;
    // Cognitive load percentage (adjusted by focus score)
    const baseLoad = totalStudyMinutes / optimalMinutes * 100;
    const adjustedLoad = baseLoad * (avgFocusScore / 100);
    // Determine status
    let status;
    if (adjustedLoad < 40) status = 'low';
    else if (adjustedLoad < 80) status = 'optimal';
    else if (adjustedLoad < 110) status = 'high';
    else status = 'overloaded';
    return {
        current: Math.min(adjustedLoad, 150),
        optimal: 75,
        status
    };
}
function generateSpacedRepetitionSchedule(items, currentDate = new Date()) {
    return items.map((item)=>{
        const daysSinceReview = Math.floor((currentDate.getTime() - item.lastReviewed.getTime()) / (1000 * 60 * 60 * 24));
        // Enhanced spaced repetition using modified SM-2 algorithm
        const baseIntervals = [
            1,
            3,
            7,
            14,
            30,
            60,
            120,
            240
        ] // Fibonacci-like progression
        ;
        const difficultyMultiplier = Math.max(0.5, Math.min(2.0, item.difficulty + 0.5)) // 0.5-2.0 range
        ;
        const streakBonus = Math.min(item.correctStreak * 0.1, 1.0) // Up to 10% bonus per correct streak
        ;
        // Calculate optimal interval
        let intervalIndex = Math.min(Math.floor(daysSinceReview / 7), baseIntervals.length - 1);
        let interval = baseIntervals[intervalIndex] * difficultyMultiplier * (1 + streakBonus);
        // Cap interval at 1 year for very easy/well-known items
        interval = Math.min(interval, 365);
        const nextReview = new Date(item.lastReviewed);
        nextReview.setDate(nextReview.getDate() + interval);
        // Calculate priority based on multiple factors
        const overdueDays = Math.max(0, currentDate.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24);
        const difficultyPriority = item.difficulty * 2 // Harder items get higher priority
        ;
        const overduePriority = overdueDays * 0.5 // Overdue items get priority boost
        ;
        const streakPriority = item.correctStreak > 0 ? 0 : 1 // New/incorrect items get priority
        ;
        const priority = Math.min(difficultyPriority + overduePriority + streakPriority, 10) // Cap at 10
        ;
        return {
            itemId: item.id,
            nextReview,
            priority,
            interval: Math.round(interval)
        };
    }).sort((a, b)=>b.priority - a.priority);
}
function analyzeKnowledgeGaps(flashcards, studySessions, timeWindow = 30 // days
) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
    // Group flashcards by subject/topic (using deckId as proxy)
    const topicGroups = flashcards.reduce((acc, card)=>{
        const topic = `Topic_${card.deckId}`;
        if (!acc[topic]) acc[topic] = [];
        acc[topic].push(card);
        return acc;
    }, {});
    const gaps = [];
    for (const [topic, cards] of Object.entries(topicGroups)){
        // Calculate confidence based on performance metrics
        const avgCorrectStreak = cards.reduce((acc, card)=>acc + card.correctStreak, 0) / cards.length;
        const avgAccuracy = cards.reduce((acc, card)=>{
            const accuracy = card.totalAttempts > 0 ? card.correctStreak / card.totalAttempts * 100 : 0;
            return acc + accuracy;
        }, 0) / cards.length;
        const confidence = Math.min((avgCorrectStreak * 10 + avgAccuracy) / 2, 100);
        // Find most recent review
        const lastReviewed = cards.reduce((latest, card)=>card.lastReviewed > latest ? card.lastReviewed : latest, new Date(0));
        // Calculate recommended review date based on confidence and time since last review
        const daysSinceReview = Math.floor((now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));
        const baseInterval = Math.max(1, 7 - Math.floor(confidence / 20)) // 1-7 days based on confidence
        ;
        const recommendedReview = new Date(lastReviewed.getTime() + baseInterval * 24 * 60 * 60 * 1000);
        // Determine priority
        let priority = 'low';
        if (confidence < 50 || daysSinceReview > 14) priority = 'high';
        else if (confidence < 75 || daysSinceReview > 7) priority = 'medium';
        gaps.push({
            topic: topic.replace('Topic_', 'Subject '),
            confidence,
            lastReviewed,
            recommendedReview,
            priority
        });
    }
    // Sort by priority and confidence
    return gaps.sort((a, b)=>{
        const priorityOrder = {
            high: 3,
            medium: 2,
            low: 1
        };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.confidence - b.confidence // Lower confidence first
        ;
    });
}
}),
"[project]/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] transform", {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 focus-visible:bg-primary/90',
            destructive: 'bg-destructive text-white hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
            outline: 'border-2 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 hover:shadow-md dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:hover:border-accent-foreground/20',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md focus-visible:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm dark:hover:bg-accent/50',
            link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
            success: 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25 focus-visible:bg-green-700',
            warning: 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/25 focus-visible:bg-orange-700'
        },
        size: {
            default: 'h-10 px-4 py-2 has-[>svg]:px-3',
            sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
            lg: 'h-12 rounded-lg px-6 has-[>svg]:px-4 text-base',
            xl: 'h-14 rounded-lg px-8 has-[>svg]:px-5 text-lg',
            icon: 'size-10',
            'icon-sm': 'size-8',
            'icon-lg': 'size-12'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : 'button';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/components/error-boundary.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ErrorBoundary",
    ()=>ErrorBoundary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
class ErrorBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Component"] {
    constructor(props){
        super(props);
        this.state = {
            hasError: false
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen bg-background flex items-center justify-center p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-md w-full text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-3xl",
                                        children: "⚠️"
                                    }, void 0, false, {
                                        fileName: "[project]/components/error-boundary.tsx",
                                        lineNumber: 36,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/error-boundary.tsx",
                                    lineNumber: 35,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-serif font-bold text-foreground mb-2",
                                    children: "Oops! Something went wrong"
                                }, void 0, false, {
                                    fileName: "[project]/components/error-boundary.tsx",
                                    lineNumber: 38,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-muted-foreground mb-6",
                                    children: "We encountered an unexpected error. Please try refreshing the page."
                                }, void 0, false, {
                                    fileName: "[project]/components/error-boundary.tsx",
                                    lineNumber: 41,
                                    columnNumber: 15
                                }, this),
                                ("TURBOPACK compile-time value", "development") === "development" && this.state.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                    className: "text-left mb-6 p-4 bg-muted rounded-lg",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                            className: "cursor-pointer font-semibold text-sm mb-2",
                                            children: "Error Details"
                                        }, void 0, false, {
                                            fileName: "[project]/components/error-boundary.tsx",
                                            lineNumber: 46,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                            className: "text-xs text-muted-foreground overflow-auto",
                                            children: [
                                                this.state.error.message,
                                                "\n",
                                                this.state.error.stack
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/error-boundary.tsx",
                                            lineNumber: 49,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/error-boundary.tsx",
                                    lineNumber: 45,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/error-boundary.tsx",
                            lineNumber: 34,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: ()=>{
                                        this.setState({
                                            hasError: false,
                                            error: undefined
                                        });
                                        window.location.href = "/";
                                    },
                                    className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground",
                                    children: "Go to Home"
                                }, void 0, false, {
                                    fileName: "[project]/components/error-boundary.tsx",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    onClick: ()=>window.location.reload(),
                                    className: "w-full",
                                    children: "Refresh Page"
                                }, void 0, false, {
                                    fileName: "[project]/components/error-boundary.tsx",
                                    lineNumber: 67,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/error-boundary.tsx",
                            lineNumber: 57,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/error-boundary.tsx",
                    lineNumber: 33,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/error-boundary.tsx",
                lineNumber: 32,
                columnNumber: 9
            }, this);
        }
        return this.props.children;
    }
}
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/lib/firebase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "db",
    ()=>db,
    "default",
    ()=>__TURBOPACK__default__export__,
    "googleProvider",
    ()=>googleProvider,
    "realtimeDb",
    ()=>realtimeDb,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/node-esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.node.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/node-esm/index.node.esm.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$database$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/database/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/database/dist/node-esm/index.node.esm.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
// Firebase configuration - Read from environment variables
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyC5i38Q_4QYx6RWs627_l5xdQ8IAY1b8I8") || "",
    authDomain: ("TURBOPACK compile-time value", "cnostruct.firebaseapp.com") || "",
    projectId: ("TURBOPACK compile-time value", "cnostruct") || "",
    storageBucket: ("TURBOPACK compile-time value", "cnostruct.firebasestorage.app") || "",
    messagingSenderId: ("TURBOPACK compile-time value", "768135253274") || "",
    appId: ("TURBOPACK compile-time value", "1:768135253274:web:9662ffb7911766ca5bf0a3") || "",
    measurementId: ("TURBOPACK compile-time value", "G-J6J233XBCY"),
    databaseURL: ("TURBOPACK compile-time value", "https://cnostruct.firebaseio.com")
};
// Check if running in browser
const isBrowser = ("TURBOPACK compile-time value", "undefined") !== "undefined";
// Validate Firebase configuration
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId;
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
// Initialize Firebase only if it hasn't been initialized already
// This prevents the "Firebase: Error (app/already-initialized)" error
let app;
if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getApps"])().length === 0) {
    try {
        app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    } catch (error) {
        console.error("Firebase initialization error:", error);
        throw new Error("Failed to initialize Firebase. Please check your configuration.");
    }
} else {
    app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getApps"])()[0];
}
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAuth"])(app);
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStorage"])(app);
const realtimeDb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$database$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDatabase"])(app);
// Set auth persistence to LOCAL (persists even after browser is closed)
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
// Log auth state for debugging
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const googleProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoogleAuthProvider"]();
googleProvider.setCustomParameters({
    prompt: "select_account"
});
const __TURBOPACK__default__export__ = app;
}),
"[project]/lib/hooks/useAuth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/node-esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebase.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function useAuth() {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["onAuthStateChanged"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["auth"], (currentUser)=>{
            setUser(currentUser);
            setLoading(false);
            setError(null);
        }, (err)=>{
            console.error("Auth state change error:", err);
            setError(err);
            setLoading(false);
        });
        return ()=>unsubscribe();
    }, []);
    const logout = async ()=>{
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["auth"]);
            setUser(null);
        } catch (err) {
            setError(err);
        }
    };
    return {
        user,
        loading,
        error,
        logout
    };
}
}),
"[project]/components/auth-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuthContext",
    ()=>useAuthContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useAuth.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: auth,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/auth-provider.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, this);
}
function useAuthContext() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within AuthProvider");
    }
    return context;
}
}),
"[project]/components/theme-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
'use client';
;
;
function ThemeProvider({ children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/theme-provider.tsx",
        lineNumber: 10,
        columnNumber: 10
    }, this);
}
}),
"[project]/components/ui/loading.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LoadingProvider",
    ()=>LoadingProvider,
    "useLoading",
    ()=>useLoading
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
"use client";
;
;
;
const LoadingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function LoadingProvider({ children }) {
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loadingMessage, setLoadingMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('Loading...');
    const setLoading = (loading, message = 'Loading...')=>{
        setIsLoading(loading);
        setLoadingMessage(message);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingContext.Provider, {
        value: {
            isLoading,
            loadingMessage,
            setLoading
        },
        children: [
            children,
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-slate-800 rounded-lg border border-slate-700 shadow-lg p-6 flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                            className: "w-6 h-6 animate-spin text-primary"
                        }, void 0, false, {
                            fileName: "[project]/components/ui/loading.tsx",
                            lineNumber: 29,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-slate-100",
                            children: loadingMessage
                        }, void 0, false, {
                            fileName: "[project]/components/ui/loading.tsx",
                            lineNumber: 30,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ui/loading.tsx",
                    lineNumber: 28,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ui/loading.tsx",
                lineNumber: 27,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/loading.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
function useLoading() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/voice.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getVoices",
    ()=>getVoices,
    "isSpeaking",
    ()=>isSpeaking,
    "isSpeechRecognitionSupported",
    ()=>isSpeechRecognitionSupported,
    "speak",
    ()=>speak,
    "stopSpeaking",
    ()=>stopSpeaking,
    "useVoiceInput",
    ()=>useVoiceInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
function isSpeechRecognitionSupported() {
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
}
function useVoiceInput(options = {}) {
    const { continuous = false, language = "en-US", onResult, onError, onStart, onEnd } = options;
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        isListening: false,
        transcript: "",
        interimTranscript: "",
        error: null,
        isSupported: false
    });
    const recognitionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const transcriptRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])("");
    // Store callbacks in refs to avoid re-running useEffect
    const onResultRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(onResult);
    const onErrorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(onError);
    const onStartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(onStart);
    const onEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(onEnd);
    // Update refs when callbacks change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        onResultRef.current = onResult;
        onErrorRef.current = onError;
        onStartRef.current = onStart;
        onEndRef.current = onEnd;
    });
    // Initialize speech recognition - only run once
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const SpeechRecognition = undefined;
        const recognition = undefined;
    }, [
        continuous,
        language
    ]); // Only re-run when these change, not callbacks
    const startListening = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!recognitionRef.current) return;
        try {
            transcriptRef.current = "";
            setState((prev)=>({
                    ...prev,
                    transcript: "",
                    interimTranscript: "",
                    error: null
                }));
            recognitionRef.current.start();
        } catch (error) {
            console.error("Error starting speech recognition:", error);
        }
    }, []);
    const stopListening = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.stop();
        } catch (error) {
            console.error("Error stopping speech recognition:", error);
        }
    }, []);
    const resetTranscript = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        transcriptRef.current = "";
        setState((prev)=>({
                ...prev,
                transcript: "",
                interimTranscript: ""
            }));
    }, []);
    return {
        state,
        startListening,
        stopListening,
        resetTranscript
    };
}
// Helper to get human-readable error messages
function getErrorMessage(error) {
    switch(error){
        case "no-speech":
            return "No speech detected. Please try again.";
        case "audio-capture":
            return "No microphone found. Please check your audio settings.";
        case "not-allowed":
            return "Microphone access denied. Please allow microphone access.";
        case "network":
            return "Network error. Please check your connection.";
        case "aborted":
            return "Speech recognition was aborted.";
        case "language-not-supported":
            return "Language not supported.";
        case "service-not-allowed":
            return "Speech recognition service not allowed.";
        default:
            return `Speech recognition error: ${error}`;
    }
}
function speak(text, options = {}) {
    return new Promise((resolve, reject)=>{
        if ("TURBOPACK compile-time truthy", 1) {
            reject(new Error("Speech synthesis not supported"));
            return;
        }
        //TURBOPACK unreachable
        ;
        const utterance = undefined;
    });
}
function getVoices() {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
}
function stopSpeaking() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function isSpeaking() {
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
}
}),
"[project]/lib/ai-client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeLearningPatterns",
    ()=>analyzeLearningPatterns,
    "chat",
    ()=>chat,
    "explainConcept",
    ()=>explainConcept,
    "generateFlashcards",
    ()=>generateFlashcards,
    "generatePersonalizedContent",
    ()=>generatePersonalizedContent,
    "generateQuiz",
    ()=>generateQuiz,
    "generateStudyPlan",
    ()=>generateStudyPlan,
    "getAssistantResponse",
    ()=>getAssistantResponse,
    "summarizeContent",
    ()=>summarizeContent
]);
"use client";
// Unified AI Client - Uses Groq (free tier) with Gemini fallback
// Groq: 14,400 requests/day free, fastest inference
// Gemini: 15 RPM / 1M tokens/day free
const GROQ_API_KEY = ("TURBOPACK compile-time value", "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") || "";
const GEMINI_API_KEY = ("TURBOPACK compile-time value", "AIzaSyDA8ReX3lUqucg23jKsWbbyviigD3jF6lU") || "";
// Models
const GROQ_MODEL = "llama-3.1-70b-versatile" // Fast, high quality
;
const GEMINI_MODEL = "gemini-2.0-flash";
// Sleep helper for retry delays
const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
// Truncate content intelligently
function truncateContent(content, maxChars) {
    if (content.length <= maxChars) return content;
    let truncated = content.slice(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('. ');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline);
    if (cutPoint > maxChars * 0.8) {
        truncated = truncated.slice(0, cutPoint + 1);
    }
    return truncated + "\n\n[Content truncated...]";
}
// Fix truncated JSON arrays
function fixTruncatedJson(jsonStr) {
    let fixed = jsonStr.trim();
    if (!fixed.startsWith('[')) {
        const arrayStart = fixed.indexOf('[');
        if (arrayStart !== -1) {
            fixed = fixed.slice(arrayStart);
        } else {
            throw new Error("No JSON array found");
        }
    }
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let lastCompleteObject = -1;
    for(let i = 0; i < fixed.length; i++){
        const char = fixed[i];
        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) continue;
        if (char === '{') bracketCount++;
        if (char === '}') {
            bracketCount--;
            if (bracketCount === 0) lastCompleteObject = i;
        }
    }
    if (lastCompleteObject > 0) {
        fixed = fixed.slice(0, lastCompleteObject + 1);
        if (!fixed.endsWith(']')) fixed += ']';
    }
    fixed = fixed.replace(/,\s*\]$/, ']');
    fixed = fixed.replace(/,\s*$/, '') + ']';
    if (!fixed.endsWith(']')) fixed += ']';
    return fixed;
}
// ==================== GROQ API ====================
async function chatWithGroq(messages, options = {}) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const allMessages = options.systemPrompt ? [
        {
            role: "system",
            content: options.systemPrompt
        },
        ...messages
    ] : messages;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: allMessages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}
// ==================== GEMINI API ====================
async function chatWithGemini(messages, options = {}) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Convert messages to Gemini format
    const contents = messages.map((msg)=>({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [
                {
                    text: msg.content
                }
            ]
        }));
    // Add system prompt as first user message if provided
    if (options.systemPrompt) {
        contents.unshift({
            role: "user",
            parts: [
                {
                    text: `System Instructions: ${options.systemPrompt}`
                }
            ]
        });
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 4096
            }
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
async function chat(messages, options = {}) {
    const maxRetries = 3;
    // Try Groq first (faster, more generous free tier)
    if ("TURBOPACK compile-time truthy", 1) {
        for(let attempt = 0; attempt < maxRetries; attempt++){
            try {
                if (attempt > 0) {
                    await sleep(Math.pow(2, attempt) * 1000);
                }
                return await chatWithGroq(messages, options);
            } catch (error) {
                console.warn(`Groq attempt ${attempt + 1} failed:`, error.message);
                if (error.message?.includes("rate") || error.message?.includes("429")) {
                    continue;
                }
                break; // Non-rate-limit error, try fallback
            }
        }
    }
    // Fallback to Gemini
    if ("TURBOPACK compile-time truthy", 1) {
        for(let attempt = 0; attempt < maxRetries; attempt++){
            try {
                if (attempt > 0) {
                    await sleep(Math.pow(2, attempt) * 1000);
                }
                return await chatWithGemini(messages, options);
            } catch (error) {
                console.warn(`Gemini attempt ${attempt + 1} failed:`, error.message);
                if (error.message?.includes("rate") || error.message?.includes("429") || error.message?.includes("exhausted")) {
                    continue;
                }
                throw error;
            }
        }
    }
    throw new Error("No AI provider available. Please configure NEXT_PUBLIC_GROQ_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY");
}
async function generateFlashcards(content, topic, count = 5, difficulty = "medium") {
    const maxContentChars = 80000 // ~20k tokens
    ;
    const processedContent = content ? truncateContent(content.trim(), maxContentChars) : "";
    const difficultyPrompts = {
        easy: "Create simple, straightforward questions with concise answers suitable for beginners.",
        medium: "Create balanced questions that test understanding with moderately detailed answers.",
        hard: "Create challenging questions that require deep understanding with comprehensive answers."
    };
    const systemPrompt = "You are an expert educator creating flashcards. Return ONLY valid JSON arrays, no other text.";
    const userPrompt = processedContent && processedContent.length > 50 ? `Create ${count} flashcards based ONLY on this study material:

"""
${processedContent}
"""

${topic ? `Topic: ${topic}` : ""}
Difficulty: ${difficulty} - ${difficultyPrompts[difficulty]}

Return ONLY a JSON array: [{"front": "Question?", "back": "Answer"}]
CRITICAL: Only use information from the provided material.` : `Create ${count} flashcards about "${topic}".
Difficulty: ${difficulty} - ${difficultyPrompts[difficulty]}
Return ONLY a JSON array: [{"front": "Question?", "back": "Answer"}]`;
    const response = await chat([
        {
            role: "user",
            content: userPrompt
        }
    ], {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 8192
    });
    // Parse JSON from response
    let jsonStr = response;
    // Clean the response to remove markdown formatting and backticks
    const cleanResponse = response.replace(/```(?:json)?\s*/g, '') // Remove opening code block markers
    .replace(/```\s*$/g, '') // Remove closing code block markers
    .replace(/`/g, '') // Remove any remaining backticks
    .trim();
    // Try to extract JSON from cleaned response
    const jsonMatch = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
    } else {
        const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (arrayMatch) jsonStr = arrayMatch[0];
    }
    let flashcards;
    try {
        flashcards = JSON.parse(jsonStr);
    } catch  {
        jsonStr = fixTruncatedJson(jsonStr);
        flashcards = JSON.parse(jsonStr);
    }
    if (!Array.isArray(flashcards)) {
        throw new Error("Invalid response format");
    }
    return flashcards.filter((card)=>card.front && card.back).slice(0, count);
}
async function getAssistantResponse(userMessage, context) {
    const systemPrompt = `You are StudyPal AI, a helpful student assistant. You help with:
- Answering study questions
- Explaining concepts
- Creating flashcards and quizzes
- Managing study schedules
- Providing encouragement and study tips

Be concise, friendly, and educational. If asked to create flashcards or perform actions, acknowledge the request and explain what you'll do.

${context?.currentPage ? `The user is currently on the ${context.currentPage} page.` : ""}
${context?.userMaterials?.length ? `The user has materials on: ${context.userMaterials.join(", ")}` : ""}`;
    const messages = [
        ...context?.conversationHistory || [],
        {
            role: "user",
            content: userMessage
        }
    ];
    return chat(messages, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1024
    });
}
async function summarizeContent(content, style = "bullet-points") {
    const processedContent = truncateContent(content, 50000);
    const stylePrompts = {
        brief: "Provide a 2-3 sentence summary.",
        detailed: "Provide a comprehensive summary covering all key points.",
        "bullet-points": "Provide a summary as bullet points highlighting key concepts."
    };
    return chat([
        {
            role: "user",
            content: `Summarize this content. ${stylePrompts[style]}

Content:
"""
${processedContent}
"""`
        }
    ], {
        temperature: 0.5,
        maxTokens: 2048
    });
}
async function explainConcept(concept, level = "intermediate") {
    const levelPrompts = {
        beginner: "Explain like I'm 10 years old, using simple language and analogies.",
        intermediate: "Explain for a college student, with some technical detail.",
        advanced: "Explain in depth with technical terminology and nuances."
    };
    return chat([
        {
            role: "user",
            content: `Explain: "${concept}"\n\n${levelPrompts[level]}`
        }
    ], {
        temperature: 0.7,
        maxTokens: 2048
    });
}
async function generateStudyPlan(subject, goals, availableTime, currentLevel = "intermediate", deadline) {
    const deadlineStr = deadline ? `Deadline: ${deadline.toDateString()}` : "";
    const prompt = `Create a detailed study plan for ${subject} with the following goals: ${goals.join(", ")}.
Available study time: ${availableTime} hours per week.
Current level: ${currentLevel}.
${deadlineStr}

Return a JSON array of study plan items with this structure:
[
  {
    "topic": "Topic name",
    "duration": 60,
    "resources": ["Resource 1", "Resource 2"],
    "priority": "high"
  }
]

Make the plan realistic, progressive, and optimized for spaced repetition.`;
    const response = await chat([
        {
            role: "user",
            content: prompt
        }
    ], {
        temperature: 0.3,
        maxTokens: 4096
    });
    try {
        // Clean the response by removing markdown code blocks and backticks
        let cleanResponse = response.trim();
        // Remove markdown code block markers
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        // Remove any remaining backticks
        cleanResponse = cleanResponse.replace(/`/g, '');
        // Try to find JSON array if response contains extra text
        const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            cleanResponse = jsonMatch[0];
        }
        return JSON.parse(cleanResponse);
    } catch (e) {
        console.error("Failed to parse study plan JSON:", e);
        console.error("Raw response:", response);
        return [];
    }
}
async function generateQuiz(contentOrTopic, topicOrQuestionCount, questionCountOrDifficulty, difficulty = "medium") {
    let content;
    let topic;
    let questionCount = 10;
    // Handle overloads
    if (typeof topicOrQuestionCount === 'string') {
        // generateQuiz(content, topic, questionCount?, difficulty?)
        content = contentOrTopic;
        topic = topicOrQuestionCount;
        if (typeof questionCountOrDifficulty === 'number') {
            questionCount = questionCountOrDifficulty;
        }
    } else {
        // generateQuiz(topic, questionCount?, difficulty?)
        content = contentOrTopic; // use topic as content
        topic = contentOrTopic;
        if (typeof topicOrQuestionCount === 'number') {
            questionCount = topicOrQuestionCount;
        }
        if (typeof questionCountOrDifficulty === 'string') {
            difficulty = questionCountOrDifficulty;
        }
    }
    const processedContent = truncateContent(content, 30000);
    const prompt = `Generate a ${questionCount}-question multiple-choice quiz on "${topic}" based on this content.
Difficulty level: ${difficulty}

Return a JSON array with this exact structure:
[
  {
    "question": "Question text?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "difficulty": "${difficulty}"
  }
]

Ensure questions test understanding, not just memorization. Make options plausible but clearly distinguishable.

Content:
"""
${processedContent}
"""`;
    const response = await chat([
        {
            role: "user",
            content: prompt
        }
    ], {
        temperature: 0.4,
        maxTokens: 6144
    });
    try {
        // Clean the response by removing markdown code blocks and backticks
        let cleanResponse = response.trim();
        // Remove markdown code block markers
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        // Remove any remaining backticks
        cleanResponse = cleanResponse.replace(/`/g, '');
        // Try to find JSON array if response contains extra text
        const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            cleanResponse = jsonMatch[0];
        }
        return JSON.parse(cleanResponse);
    } catch (e) {
        console.error("Failed to parse quiz JSON:", e);
        console.error("Raw response:", response);
        return [];
    }
}
async function analyzeLearningPatterns(userHistory) {
    const historyStr = userHistory.map((h)=>`${h.subject}: ${h.score}% in ${h.timeSpent}min on ${h.date.toDateString()}`).join('\n');
    const prompt = `Analyze this learning history and provide insights:

${historyStr}

Return a JSON object with:
{
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1"],
  "recommendations": ["Recommendation 1"],
  "predictedImprovement": 15,
  "optimalStudyTimes": ["Morning 9-11 AM", "Evening 7-9 PM"]
}

Focus on patterns, time management, and subject-specific advice.`;
    const response = await chat([
        {
            role: "user",
            content: prompt
        }
    ], {
        temperature: 0.2,
        maxTokens: 2048
    });
    try {
        // Clean the response by removing markdown code blocks and backticks
        let cleanResponse = response.trim();
        // Remove markdown code block markers
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        // Remove any remaining backticks
        cleanResponse = cleanResponse.replace(/`/g, '');
        // Try to find JSON object if response contains extra text
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanResponse = jsonMatch[0];
        }
        return JSON.parse(cleanResponse);
    } catch (e) {
        console.error("Failed to parse analysis JSON:", e);
        console.error("Raw response:", response);
        return {
            strengths: [],
            weaknesses: [],
            recommendations: [],
            predictedImprovement: 0,
            optimalStudyTimes: []
        };
    }
}
async function generatePersonalizedContent(userProfile, topic, contentType) {
    const stylePrompts = {
        visual: "Include diagrams, charts, and visual analogies",
        auditory: "Use storytelling and audio-friendly explanations",
        kinesthetic: "Include hands-on examples and practical applications",
        reading: "Provide detailed written explanations with references"
    };
    const typePrompts = {
        summary: "Create a concise summary",
        examples: "Provide practical examples and case studies",
        practice: "Generate practice problems and exercises",
        explanation: "Explain the concept in depth"
    };
    const prompt = `Create ${contentType} content for "${topic}" tailored to:
- Learning style: ${userProfile.learningStyle} (${stylePrompts[userProfile.learningStyle]})
- Goals: ${userProfile.goals.join(", ")}
- Current level: ${userProfile.currentLevel}
- Preferred subjects: ${userProfile.preferredSubjects.join(", ")}

${typePrompts[contentType]}

Make it engaging, personalized, and effective for this learner.`;
    return chat([
        {
            role: "user",
            content: prompt
        }
    ], {
        temperature: 0.6,
        maxTokens: 3072
    });
}
}),
"[project]/lib/firestore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addFlashcard",
    ()=>addFlashcard,
    "addGradeEntry",
    ()=>addGradeEntry,
    "addMaterial",
    ()=>addMaterial,
    "addMemory",
    ()=>addMemory,
    "addMessageToConversation",
    ()=>addMessageToConversation,
    "clearPlanTasks",
    ()=>clearPlanTasks,
    "createCalendarEvent",
    ()=>createCalendarEvent,
    "createConversation",
    ()=>createConversation,
    "createCourse",
    ()=>createCourse,
    "createFlashcardDeck",
    ()=>createFlashcardDeck,
    "createFlashcards",
    ()=>createFlashcards,
    "createHabit",
    ()=>createHabit,
    "createMaterialFolder",
    ()=>createMaterialFolder,
    "createStudyGroup",
    ()=>createStudyGroup,
    "createStudyPlan",
    ()=>createStudyPlan,
    "createStudyTask",
    ()=>createStudyTask,
    "createTask",
    ()=>createTask,
    "createTimeBlock",
    ()=>createTimeBlock,
    "deleteCalendarEvent",
    ()=>deleteCalendarEvent,
    "deleteConversation",
    ()=>deleteConversation,
    "deleteCourse",
    ()=>deleteCourse,
    "deleteHabit",
    ()=>deleteHabit,
    "deleteMaterial",
    ()=>deleteMaterial,
    "deleteMaterialFolder",
    ()=>deleteMaterialFolder,
    "deleteMemory",
    ()=>deleteMemory,
    "deleteStudyPlan",
    ()=>deleteStudyPlan,
    "deleteStudyTask",
    ()=>deleteStudyTask,
    "deleteTask",
    ()=>deleteTask,
    "deleteTimeBlock",
    ()=>deleteTimeBlock,
    "getBookmarkedJobs",
    ()=>getBookmarkedJobs,
    "getCalendarEvents",
    ()=>getCalendarEvents,
    "getConversations",
    ()=>getConversations,
    "getCourseGrades",
    ()=>getCourseGrades,
    "getCourses",
    ()=>getCourses,
    "getDailyStats",
    ()=>getDailyStats,
    "getFlashcardDecks",
    ()=>getFlashcardDecks,
    "getFlashcards",
    ()=>getFlashcards,
    "getHabits",
    ()=>getHabits,
    "getMaterialFolders",
    ()=>getMaterialFolders,
    "getMaterials",
    ()=>getMaterials,
    "getMemories",
    ()=>getMemories,
    "getPomodoroSessions",
    ()=>getPomodoroSessions,
    "getPomodoroSettings",
    ()=>getPomodoroSettings,
    "getStudyGroup",
    ()=>getStudyGroup,
    "getStudyGroups",
    ()=>getStudyGroups,
    "getStudyPlans",
    ()=>getStudyPlans,
    "getStudySessions",
    ()=>getStudySessions,
    "getStudyTasks",
    ()=>getStudyTasks,
    "getTasks",
    ()=>getTasks,
    "getTimeBlocks",
    ()=>getTimeBlocks,
    "getUserData",
    ()=>getUserData,
    "getUserProfile",
    ()=>getUserProfile,
    "getWeeklyStats",
    ()=>getWeeklyStats,
    "joinGroup",
    ()=>joinGroup,
    "leaveGroup",
    ()=>leaveGroup,
    "logPomodoroSession",
    ()=>logPomodoroSession,
    "logStudySession",
    ()=>logStudySession,
    "savePomodoroSettings",
    ()=>savePomodoroSettings,
    "searchMemories",
    ()=>searchMemories,
    "sendGroupMessage",
    ()=>sendGroupMessage,
    "subscribeToGroupMessages",
    ()=>subscribeToGroupMessages,
    "toggleHabitCompletion",
    ()=>toggleHabitCompletion,
    "toggleJobBookmark",
    ()=>toggleJobBookmark,
    "toggleSubtask",
    ()=>toggleSubtask,
    "toggleTaskComplete",
    ()=>toggleTaskComplete,
    "updateCalendarEvent",
    ()=>updateCalendarEvent,
    "updateConversationTitle",
    ()=>updateConversationTitle,
    "updateCourse",
    ()=>updateCourse,
    "updateMaterialFolder",
    ()=>updateMaterialFolder,
    "updatePlanProgress",
    ()=>updatePlanProgress,
    "updatePlanTotalTasks",
    ()=>updatePlanTotalTasks,
    "updateTask",
    ()=>updateTask,
    "updateTimeBlock",
    ()=>updateTimeBlock,
    "updateUserProfile",
    ()=>updateUserProfile,
    "uploadFile",
    ()=>uploadFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.node.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/node-esm/index.node.esm.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebase.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
async function getMaterialFolders(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materialFolders"));
    const folders = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((f)=>f.userId === userId);
    return folders.sort((a, b)=>a.name.localeCompare(b.name));
}
async function createMaterialFolder(folder) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materialFolders"), {
        ...folder,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function deleteMaterialFolder(folderId) {
    // Delete the folder
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materialFolders", folderId));
    // Move materials in this folder to root (remove folderId)
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materials"));
    const folderMaterials = snapshot.docs.filter((d)=>d.data().folderId === folderId);
    for (const docSnap of folderMaterials){
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docSnap.ref, {
            folderId: null
        });
    }
}
async function updateMaterialFolder(materialId, folderId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materials", materialId), {
        folderId
    });
}
async function getMaterials(userId, folderId) {
    // Fetch all and filter client-side to avoid index requirements
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materials"));
    let materials = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((m)=>m.userId === userId);
    // Filter by folder if specified
    if (folderId !== undefined) {
        materials = materials.filter((m)=>(m.folderId || null) === folderId);
    }
    return materials.sort((a, b)=>b.createdAt.getTime() - a.createdAt.getTime());
}
async function addMaterial(material) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materials"), {
        ...material,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function uploadFile(file, userId) {
    const fileRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"], `materials/${userId}/${Date.now()}_${file.name}`);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uploadBytes"])(fileRef, file);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDownloadURL"])(fileRef);
}
async function deleteMaterial(materialId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "materials", materialId));
}
async function getFlashcardDecks(userId) {
    // Fetch all and filter client-side to avoid index requirements
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "flashcardDecks"));
    const decks = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((d)=>d.userId === userId);
    return decks.sort((a, b)=>b.createdAt.getTime() - a.createdAt.getTime());
}
async function createFlashcardDeck(deck) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "flashcardDecks"), {
        ...deck,
        cardCount: 0,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function getFlashcards(deckId) {
    // Fetch all and filter client-side to avoid index requirements
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "flashcards"));
    return snapshot.docs.map((docSnap)=>({
            id: docSnap.id,
            ...docSnap.data()
        })).filter((c)=>c.deckId === deckId);
}
async function addFlashcard(card) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "flashcards"), {
        ...card,
        createdAt: new Date()
    });
    // Update deck card count
    const deckRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "flashcardDecks", card.deckId);
    const deckSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(deckRef);
    if (deckSnap.exists()) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(deckRef, {
            cardCount: (deckSnap.data().cardCount || 0) + 1
        });
    }
    return docRef.id;
}
async function getStudyPlans(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyPlans"));
    const plans = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            examDate: data.examDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((p)=>p.userId === userId);
    return plans.sort((a, b)=>a.examDate.getTime() - b.examDate.getTime());
}
async function createStudyPlan(plan) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyPlans"), {
        ...plan,
        completedTasks: 0,
        examDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Timestamp"].fromDate(plan.examDate),
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    // After tasks are created, update the totalTasks count
    return docRef.id;
}
async function deleteStudyPlan(planId) {
    // Delete the plan
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyPlans", planId));
    // Delete all tasks associated with this plan
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks"));
    const planTasks = snapshot.docs.filter((d)=>d.data().planId === planId);
    for (const docSnap of planTasks){
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])(docSnap.ref);
    }
}
async function updatePlanProgress(planId, completedTasks) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyPlans", planId), {
        completedTasks
    });
}
async function updatePlanTotalTasks(planId, totalTasks) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyPlans", planId), {
        totalTasks
    });
}
async function getStudyTasks(userId, planId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks"));
    const tasks = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            dueDate: data.dueDate?.toDate() || new Date(),
            priority: data.priority || "medium",
            status: data.status || "pending"
        };
    }).filter((t)=>t.userId === userId && (!planId || t.planId === planId));
    return tasks.sort((a, b)=>a.day - b.day);
}
async function createStudyTask(task) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks"), {
        ...task,
        completed: false,
        dueDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Timestamp"].fromDate(task.dueDate)
    });
    return docRef.id;
}
async function toggleTaskComplete(taskId, completed, planId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks", taskId), {
        completed
    });
    // Update plan progress if planId provided
    if (planId) {
        const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks"));
        const planTasks = snapshot.docs.filter((d)=>d.data().planId === planId);
        const completedCount = planTasks.filter((d)=>d.data().completed || d.id === taskId && completed).length;
        await updatePlanProgress(planId, completedCount);
    }
}
async function deleteStudyTask(taskId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks", taskId));
}
async function clearPlanTasks(planId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyTasks"));
    const planTasks = snapshot.docs.filter((d)=>d.data().planId === planId);
    for (const docSnap of planTasks){
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])(docSnap.ref);
    }
}
async function getStudyGroups(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyGroups"));
    let groups = snapshot.docs.map((doc)=>({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
    // Filter groups where user is a member if userId is provided
    if (userId) {
        groups = groups.filter((group)=>group.members.some((member)=>member.userId === userId));
    }
    // Sort client-side to avoid index requirement
    return groups.sort((a, b)=>b.createdAt.getTime() - a.createdAt.getTime());
}
async function getStudyGroup(groupId) {
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyGroups", groupId));
    if (!docSnap.exists()) return null;
    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date()
    };
}
async function createStudyGroup(group) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyGroups"), {
        ...group,
        memberCount: group.members.length,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function joinGroup(groupId, member) {
    const groupRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyGroups", groupId);
    const groupSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(groupRef);
    if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const members = groupData.members || [];
        // Check if group is full
        if (members.length >= (groupData.maxMembers || 10)) {
            throw new Error("Group is full");
        }
        if (!members.some((m)=>m.userId === member.userId)) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(groupRef, {
                members: [
                    ...members,
                    member
                ],
                memberCount: members.length + 1
            });
        }
    }
}
async function leaveGroup(groupId, userId) {
    const groupRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studyGroups", groupId);
    const groupSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(groupRef);
    if (groupSnap.exists()) {
        const members = groupSnap.data().members || [];
        const newMembers = members.filter((m)=>m !== userId);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(groupRef, {
            members: newMembers,
            memberCount: newMembers.length
        });
    }
}
function subscribeToGroupMessages(groupId, callback) {
    // Subscribe to all messages and filter client-side to avoid index requirements
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["onSnapshot"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "groupMessages"), (snapshot)=>{
        const messages = snapshot.docs.map((docSnap)=>{
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            };
        }).filter((m)=>m.groupId === groupId);
        callback(messages.sort((a, b)=>a.createdAt.getTime() - b.createdAt.getTime()));
    });
}
async function sendGroupMessage(message) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "groupMessages"), {
        ...message,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function getBookmarkedJobs(userId) {
    // Fetch all and filter client-side to avoid index requirements
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "bookmarkedJobs"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((b)=>b.userId === userId);
}
async function toggleJobBookmark(job) {
    // Fetch all and filter client-side to avoid index requirements
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "bookmarkedJobs"));
    const existing = snapshot.docs.find((d)=>d.data().userId === job.userId && d.data().jobId === job.jobId);
    if (!existing) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "bookmarkedJobs"), {
            ...job,
            createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
        });
        return true // Now bookmarked
        ;
    } else {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])(existing.ref);
        return false // Unbookmarked
        ;
    }
}
async function getUserProfile(userId) {
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "users", userId));
    return docSnap.exists() ? docSnap.data() : null;
}
async function updateUserProfile(userId, data) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "users", userId), data, {
        merge: true
    });
}
async function getConversations(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "conversations"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            messages: (data.messages || []).map((m)=>({
                    ...m,
                    timestamp: m.timestamp?.toDate() || new Date()
                })),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
        };
    }).filter((c)=>c.userId === userId).sort((a, b)=>b.updatedAt.getTime() - a.updatedAt.getTime());
}
async function createConversation(userId, title = "New Conversation") {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "conversations"), {
        userId,
        title,
        messages: [],
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function addMessageToConversation(conversationId, message) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "conversations", conversationId);
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (!docSnap.exists()) {
        throw new Error("Conversation not found");
    }
    const data = docSnap.data();
    const messages = data.messages || [];
    messages.push({
        ...message,
        timestamp: new Date()
    });
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
        messages,
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
}
async function deleteConversation(conversationId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "conversations", conversationId));
}
async function updateConversationTitle(conversationId, title) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "conversations", conversationId), {
        title
    });
}
async function getMemories(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "memories"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((m)=>m.userId === userId).sort((a, b)=>b.createdAt.getTime() - a.createdAt.getTime());
}
async function addMemory(memory) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "memories"), {
        ...memory,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function deleteMemory(memoryId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "memories", memoryId));
}
async function searchMemories(userId, query) {
    const memories = await getMemories(userId);
    const lowerQuery = query.toLowerCase();
    return memories.filter((m)=>m.content.toLowerCase().includes(lowerQuery));
}
async function getTasks(userId, filters) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "tasks"));
    let tasks = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            dueDate: data.dueDate?.toDate(),
            scheduledDate: data.scheduledDate?.toDate(),
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            subtasks: data.subtasks || [],
            tags: data.tags || [],
            links: data.links || []
        };
    }).filter((t)=>t.userId === userId);
    if (filters?.status) tasks = tasks.filter((t)=>t.status === filters.status);
    if (filters?.priority) tasks = tasks.filter((t)=>t.priority === filters.priority);
    if (filters?.course) tasks = tasks.filter((t)=>t.course === filters.course);
    if (filters?.tag) tasks = tasks.filter((t)=>t.tags.includes(filters.tag));
    if (filters?.dateRange) {
        tasks = tasks.filter((t)=>t.dueDate && t.dueDate >= filters.dateRange.start && t.dueDate <= filters.dateRange.end);
    }
    return tasks.sort((a, b)=>{
        const priorityOrder = {
            urgent: 0,
            high: 1,
            medium: 2,
            low: 3
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}
async function createTask(task) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "tasks"), {
        ...task,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function updateTask(taskId, updates) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "tasks", taskId), {
        ...updates,
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
}
async function deleteTask(taskId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "tasks", taskId));
}
async function toggleSubtask(taskId, subtaskId) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "tasks", taskId);
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (!docSnap.exists()) return;
    const task = docSnap.data();
    const subtasks = task.subtasks || [];
    const updatedSubtasks = subtasks.map((st)=>st.id === subtaskId ? {
            ...st,
            completed: !st.completed
        } : st);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
        subtasks: updatedSubtasks,
        updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
}
async function getCalendarEvents(userId, dateRange) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "calendarEvents"));
    let events = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            recurrence: data.recurrence ? {
                ...data.recurrence,
                endDate: data.recurrence.endDate?.toDate(),
                exceptions: data.recurrence.exceptions?.map((e)=>e.toDate()) || []
            } : undefined
        };
    }).filter((e)=>e.userId === userId);
    if (dateRange) {
        events = events.filter((e)=>e.startTime >= dateRange.start && e.startTime <= dateRange.end);
    }
    return events.sort((a, b)=>a.startTime.getTime() - b.startTime.getTime());
}
async function createCalendarEvent(event) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "calendarEvents"), {
        ...event,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function updateCalendarEvent(eventId, updates) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "calendarEvents", eventId), updates);
}
async function deleteCalendarEvent(eventId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "calendarEvents", eventId));
}
async function getPomodoroSettings(userId) {
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "pomodoroSettings", userId));
    return docSnap.exists() ? docSnap.data() : null;
}
async function savePomodoroSettings(settings) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "pomodoroSettings", settings.userId), settings);
}
async function logPomodoroSession(session) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "pomodoroSessions"), session);
    return docRef.id;
}
async function getPomodoroSessions(userId, dateRange) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "pomodoroSessions"));
    let sessions = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate()
        };
    }).filter((s)=>s.userId === userId);
    if (dateRange) {
        sessions = sessions.filter((s)=>s.startTime >= dateRange.start && s.startTime <= dateRange.end);
    }
    return sessions.sort((a, b)=>b.startTime.getTime() - a.startTime.getTime());
}
async function logStudySession(session) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studySessions"), session);
    // Update daily stats
    const dateStr = session.startTime.toISOString().split('T')[0];
    await updateDailyStats(session.userId, dateStr, session.duration, session.course);
    return docRef.id;
}
async function getStudySessions(userId, dateRange) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "studySessions"));
    let sessions = snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            tags: data.tags || []
        };
    }).filter((s)=>s.userId === userId);
    if (dateRange) {
        sessions = sessions.filter((s)=>s.startTime >= dateRange.start && s.startTime <= dateRange.end);
    }
    return sessions.sort((a, b)=>b.startTime.getTime() - a.startTime.getTime());
}
async function getDailyStats(userId, date) {
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "dailyStats", `${userId}_${date}`));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        date: data.date?.toDate() || new Date(),
        coursesStudied: data.coursesStudied || []
    };
}
async function getWeeklyStats(userId) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const stats = [];
    for(let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)){
        const dateStr = d.toISOString().split('T')[0];
        const dayStat = await getDailyStats(userId, dateStr);
        if (dayStat) stats.push(dayStat);
    }
    return stats;
}
async function updateDailyStats(userId, dateStr, minutes, course) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "dailyStats", `${userId}_${dateStr}`);
    const existing = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (existing.exists()) {
        const data = existing.data();
        const coursesStudied = data.coursesStudied || [];
        if (course && !coursesStudied.includes(course)) {
            coursesStudied.push(course);
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
            totalStudyMinutes: (data.totalStudyMinutes || 0) + minutes,
            coursesStudied
        });
    } else {
        // Calculate streak
        const yesterday = new Date(dateStr);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStats = await getDailyStats(userId, yesterday.toISOString().split('T')[0]);
        const streakDay = yesterdayStats ? yesterdayStats.streakDay + 1 : 1;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setDoc"])(docRef, {
            userId,
            date: new Date(dateStr),
            totalStudyMinutes: minutes,
            taskCompleted: 0,
            pomodoroCompleted: 0,
            coursesStudied: course ? [
                course
            ] : [],
            streakDay
        });
    }
}
async function getCourses(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "courses"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            schedule: data.schedule || [],
            examDate: data.examDate?.toDate()
        };
    }).filter((c)=>c.userId === userId);
}
async function createCourse(course) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "courses"), course);
    return docRef.id;
}
async function updateCourse(courseId, updates) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "courses", courseId), updates);
}
async function deleteCourse(courseId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "courses", courseId));
}
async function getCourseGrades(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "courseGrades"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            grades: (data.grades || []).map((g)=>({
                    ...g,
                    date: g.date?.toDate() || new Date()
                }))
        };
    }).filter((g)=>g.userId === userId);
}
async function addGradeEntry(courseGradeId, entry) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "courseGrades", courseGradeId);
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const grades = data.grades || [];
    grades.push({
        ...entry,
        id: Date.now().toString()
    });
    // Calculate current grade
    const totalWeight = grades.reduce((sum, g)=>sum + g.weight, 0);
    const weightedScore = grades.reduce((sum, g)=>sum + g.score / g.maxScore * 100 * (g.weight / 100), 0);
    const currentGrade = totalWeight > 0 ? weightedScore / totalWeight * 100 : 0;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
        grades,
        currentGrade
    });
}
async function getHabits(userId) {
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "habits"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            completions: data.completions || []
        };
    }).filter((h)=>h.userId === userId && !h.isArchived);
}
async function createHabit(habit) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "habits"), {
        ...habit,
        currentStreak: 0,
        longestStreak: 0,
        completions: [],
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function toggleHabitCompletion(habitId, date) {
    const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "habits", habitId);
    const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
    if (!docSnap.exists()) return;
    const habit = docSnap.data();
    const completions = habit.completions || [];
    const existingIdx = completions.findIndex((c)=>c.date === date);
    if (existingIdx >= 0) {
        completions[existingIdx].completed = !completions[existingIdx].completed;
    } else {
        completions.push({
            date,
            completed: true
        });
    }
    // Calculate streak
    let streak = 0;
    const today = new Date();
    for(let i = 0; i < 365; i++){
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const completion = completions.find((c)=>c.date === dateStr);
        if (completion?.completed) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    const longestStreak = Math.max(habit.longestStreak || 0, streak);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])(docRef, {
        completions,
        currentStreak: streak,
        longestStreak
    });
}
async function deleteHabit(habitId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "habits", habitId), {
        isArchived: true
    });
}
async function getTimeBlocks(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const snapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "timeBlocks"));
    return snapshot.docs.map((docSnap)=>{
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date()
        };
    }).filter((tb)=>tb.userId === userId && tb.startTime >= startOfDay && tb.startTime <= endOfDay).sort((a, b)=>a.startTime.getTime() - b.startTime.getTime());
}
async function createTimeBlock(block) {
    const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "timeBlocks"), {
        ...block,
        createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["serverTimestamp"])()
    });
    return docRef.id;
}
async function updateTimeBlock(blockId, updates) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "timeBlocks", blockId), updates);
}
async function deleteTimeBlock(blockId) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deleteDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "timeBlocks", blockId));
}
async function createFlashcards(userId, cards) {
    const flashcardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"], "flashcards");
    const createdCards = [];
    for (const cardData of cards){
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["doc"])(flashcardsRef);
        const card = {
            id: docRef.id,
            userId,
            ...cardData,
            createdAt: new Date()
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setDoc"])(docRef, card);
        createdCards.push(card);
    }
    return createdCards;
}
async function getUserData(userId) {
    const [tasks, courses, habits] = await Promise.all([
        getTasks(userId),
        getCourses(userId),
        getHabits(userId)
    ]);
    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = await getDailyStats(userId, today);
    // Calculate user streak (simplified - could be more sophisticated)
    let userStreak = 0;
    if (dailyStats) {
        userStreak = dailyStats.streakDay;
    }
    return {
        tasks,
        courses,
        habits,
        dailyStats,
        userStreak
    };
}
}),
"[project]/lib/assistant.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "executeCommand",
    ()=>executeCommand,
    "getSuggestedActions",
    ()=>getSuggestedActions,
    "parseCommand",
    ()=>parseCommand
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai-client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firestore.ts [app-ssr] (ecmascript)");
"use client";
;
;
// Intent patterns for quick local detection
const intentPatterns = [
    {
        intent: "create_flashcards",
        patterns: [
            /create\s+(\d+\s+)?flashcards?\s+(about|on|for)\s+(.+)/i,
            /make\s+(\d+\s+)?flashcards?\s+(about|on|for)\s+(.+)/i,
            /generate\s+(\d+\s+)?flashcards?\s+(about|on|for)\s+(.+)/i,
            /flashcards?\s+(about|on|for)\s+(.+)/i
        ]
    },
    {
        intent: "quiz_me",
        patterns: [
            /quiz\s+me\s+(on|about)\s+(.+)/i,
            /test\s+me\s+(on|about)\s+(.+)/i,
            /ask\s+me\s+questions?\s+(about|on)\s+(.+)/i
        ]
    },
    {
        intent: "explain",
        patterns: [
            /explain\s+(.+)/i,
            /what\s+is\s+(.+)/i,
            /what\s+are\s+(.+)/i,
            /tell\s+me\s+about\s+(.+)/i,
            /how\s+does\s+(.+)\s+work/i
        ]
    },
    {
        intent: "summarize",
        patterns: [
            /summarize\s+(.+)/i,
            /summary\s+of\s+(.+)/i,
            /give\s+me\s+a\s+summary\s+of\s+(.+)/i
        ]
    },
    {
        intent: "navigate",
        patterns: [
            /go\s+to\s+(.+)/i,
            /open\s+(.+)/i,
            /show\s+me\s+(.+)/i,
            /take\s+me\s+to\s+(.+)/i
        ]
    },
    {
        intent: "add_task",
        patterns: [
            /add\s+task\s+(.+)/i,
            /create\s+task\s+(.+)/i,
            /remind\s+me\s+to\s+(.+)/i,
            /schedule\s+(.+)/i
        ]
    },
    {
        intent: "remember",
        patterns: [
            /remember\s+that\s+(.+)/i,
            /note\s+that\s+(.+)/i,
            /save\s+this:\s*(.+)/i,
            /keep\s+in\s+mind\s+(.+)/i
        ]
    },
    {
        intent: "search_materials",
        patterns: [
            /search\s+(for\s+)?(.+)\s+in\s+materials/i,
            /find\s+(.+)\s+in\s+my\s+(notes|materials)/i,
            /do\s+i\s+have\s+(notes|materials)\s+on\s+(.+)/i,
            /what\s+do\s+i\s+have\s+on\s+(.+)/i
        ]
    },
    {
        intent: "greeting",
        patterns: [
            /^(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy|yo)[\s!?.]*$/i
        ]
    },
    {
        intent: "help",
        patterns: [
            /^(help|what\s+can\s+you\s+do|commands|how\s+do\s+i)[\s?]*$/i,
            /show\s+(me\s+)?help/i
        ]
    }
];
// Page name mappings for navigation
const pageAliases = {
    "flashcards": "/flashcards",
    "flash cards": "/flashcards",
    "cards": "/flashcards",
    "materials": "/materials",
    "notes": "/materials",
    "documents": "/materials",
    "planner": "/planner",
    "schedule": "/planner",
    "calendar": "/planner",
    "tasks": "/planner",
    "groups": "/groups",
    "study groups": "/groups",
    "support": "/support",
    "help": "/support",
    "home": "/",
    "dashboard": "/",
    "settings": "/settings"
};
function parseCommand(input) {
    const trimmedInput = input.trim();
    // Check each intent pattern
    for (const { intent, patterns } of intentPatterns){
        for (const pattern of patterns){
            const match = trimmedInput.match(pattern);
            if (match) {
                const entities = extractEntities(intent, match, trimmedInput);
                return {
                    intent,
                    entities,
                    originalText: trimmedInput,
                    confidence: 0.9
                };
            }
        }
    }
    // Default to general question if no pattern matches
    return {
        intent: "general_question",
        entities: {
            query: trimmedInput
        },
        originalText: trimmedInput,
        confidence: 0.5
    };
}
// Extract entities from matched patterns
function extractEntities(intent, match, originalText) {
    const entities = {};
    switch(intent){
        case "create_flashcards":
            {
                // Extract count if present
                const countMatch = originalText.match(/(\d+)\s+flashcards?/i);
                if (countMatch) {
                    entities.count = parseInt(countMatch[1]);
                }
                // Extract topic - last captured group
                entities.topic = match[match.length - 1]?.trim();
                // Extract difficulty
                const diffMatch = originalText.match(/(easy|medium|hard)/i);
                if (diffMatch) {
                    entities.difficulty = diffMatch[1].toLowerCase();
                }
                break;
            }
        case "quiz_me":
            entities.topic = match[match.length - 1]?.trim();
            break;
        case "explain":
            entities.topic = match[1]?.trim();
            break;
        case "summarize":
            entities.content = match[1]?.trim();
            break;
        case "navigate":
            {
                const destination = match[1]?.toLowerCase().trim();
                entities.destination = pageAliases[destination] || destination;
                break;
            }
        case "add_task":
            entities.content = match[1]?.trim();
            break;
        case "remember":
            entities.content = match[1]?.trim();
            break;
        case "search_materials":
            entities.query = match[match.length - 1]?.trim();
            break;
    }
    return entities;
}
async function executeCommand(command, context) {
    switch(command.intent){
        case "greeting":
            return {
                success: true,
                message: getGreeting(),
                action: {
                    type: "speak"
                }
            };
        case "help":
            return {
                success: true,
                message: getHelpMessage(),
                action: {
                    type: "none"
                }
            };
        case "navigate":
            if (command.entities.destination) {
                return {
                    success: true,
                    message: `Taking you to ${command.entities.destination}...`,
                    action: {
                        type: "navigate",
                        data: {
                            path: command.entities.destination
                        }
                    }
                };
            }
            return {
                success: false,
                message: "I didn't catch where you want to go. Try saying 'go to flashcards' or 'open planner'."
            };
        case "create_flashcards":
            if (command.entities.topic && context.userId) {
                try {
                    const count = command.entities.count || 5;
                    const difficulty = command.entities.difficulty || "medium";
                    // Try to find relevant materials for the topic
                    const userMaterials = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaterials"])(context.userId);
                    const relevantMaterials = userMaterials.filter((m)=>m.title?.toLowerCase().includes(command.entities.topic.toLowerCase()) || m.subject?.toLowerCase().includes(command.entities.topic.toLowerCase()) || m.content?.toLowerCase().includes(command.entities.topic.toLowerCase()));
                    let content = "";
                    let topic = command.entities.topic;
                    if (relevantMaterials.length > 0) {
                        // Use the most relevant material's content
                        const bestMatch = relevantMaterials[0];
                        content = bestMatch.content || "";
                        topic = bestMatch.title || bestMatch.subject || command.entities.topic;
                    }
                    const flashcards = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateFlashcards"])(content, topic, count, difficulty);
                    return {
                        success: true,
                        message: relevantMaterials.length > 0 ? `I've created ${flashcards.length} flashcards about "${topic}" using your study materials.` : `I've created ${flashcards.length} flashcards about "${command.entities.topic}".`,
                        action: {
                            type: "show_flashcards",
                            data: {
                                flashcards,
                                topic: command.entities.topic
                            }
                        }
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: `Sorry, I couldn't create flashcards: ${error.message}`
                    };
                }
            }
            return {
                success: false,
                message: "What topic would you like flashcards about?"
            };
        case "quiz_me":
            if (command.entities.topic && context.userId) {
                try {
                    // Try to find relevant materials for the topic
                    const userMaterials = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaterials"])(context.userId);
                    const relevantMaterials = userMaterials.filter((m)=>m.title?.toLowerCase().includes(command.entities.topic.toLowerCase()) || m.subject?.toLowerCase().includes(command.entities.topic.toLowerCase()) || m.content?.toLowerCase().includes(command.entities.topic.toLowerCase()));
                    let content = "";
                    let topic = command.entities.topic;
                    if (relevantMaterials.length > 0) {
                        // Use the most relevant material's content
                        const bestMatch = relevantMaterials[0];
                        content = bestMatch.content || "";
                        topic = bestMatch.title || bestMatch.subject || command.entities.topic;
                    }
                    const quiz = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateQuiz"])(content, topic, 5);
                    return {
                        success: true,
                        message: relevantMaterials.length > 0 ? `Let's quiz you on "${topic}" using your study materials! I have ${quiz.length} questions ready.` : `Let's quiz you on "${command.entities.topic}"! I have ${quiz.length} questions ready.`,
                        action: {
                            type: "show_quiz",
                            data: {
                                quiz,
                                topic: command.entities.topic
                            }
                        }
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: `Sorry, I couldn't create a quiz: ${error.message}`
                    };
                }
            }
            return {
                success: false,
                message: "What topic would you like me to quiz you on?"
            };
        case "explain":
            if (command.entities.topic) {
                try {
                    const explanation = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["explainConcept"])(command.entities.topic);
                    return {
                        success: true,
                        message: explanation,
                        action: {
                            type: "speak"
                        }
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: `Sorry, I couldn't explain that: ${error.message}`
                    };
                }
            }
            return {
                success: false,
                message: "What would you like me to explain?"
            };
        case "summarize":
            if (command.entities.content) {
                try {
                    const summary = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["summarizeContent"])(command.entities.content);
                    return {
                        success: true,
                        message: summary,
                        action: {
                            type: "speak"
                        }
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: `Sorry, I couldn't summarize that: ${error.message}`
                    };
                }
            }
            return {
                success: false,
                message: "What would you like me to summarize?"
            };
        case "remember":
            if (command.entities.content) {
                return {
                    success: true,
                    message: `Got it! I'll remember: "${command.entities.content}"`,
                    action: {
                        type: "add_memory",
                        data: {
                            content: command.entities.content,
                            category: "note"
                        }
                    }
                };
            }
            return {
                success: false,
                message: "What would you like me to remember?"
            };
        case "search_materials":
            if (command.entities.query && context.userMaterials) {
                const matches = context.userMaterials.filter((m)=>m.title.toLowerCase().includes(command.entities.query.toLowerCase()) || m.subject?.toLowerCase().includes(command.entities.query.toLowerCase()));
                if (matches.length > 0) {
                    return {
                        success: true,
                        message: `I found ${matches.length} material(s) related to "${command.entities.query}": ${matches.map((m)=>m.title).join(", ")}`
                    };
                }
                return {
                    success: true,
                    message: `I didn't find any materials about "${command.entities.query}" in your library.`
                };
            }
            return {
                success: false,
                message: "What are you looking for in your materials?"
            };
        case "add_task":
            return {
                success: true,
                message: `I'll add "${command.entities.content}" to your planner. You can refine it there.`,
                action: {
                    type: "navigate",
                    data: {
                        path: "/planner",
                        prefill: command.entities.content
                    }
                }
            };
        case "general_question":
        default:
            try {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["chat"])([
                    {
                        role: "user",
                        content: command.originalText
                    }
                ], {
                    systemPrompt: `You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant for students. 
Speak in a polite, sophisticated manner like the AI assistant from Iron Man - helpful, slightly witty, and professional.
Be concise and educational. Use phrases like "Certainly, sir/madam", "Right away", "I've analyzed...", "May I suggest..."
${context.currentPage ? `User is currently viewing: ${context.currentPage}` : ""}
${context.userMaterials?.length ? `User's study materials include: ${context.userMaterials.map((m)=>m.title).join(", ")}` : ""}`
                });
                return {
                    success: true,
                    message: response,
                    action: {
                        type: "speak"
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    message: "I apologize, but I'm experiencing a temporary disruption. Shall I try again?"
                };
            }
    }
}
// ==================== HELPERS ====================
function getGreeting() {
    const hour = new Date().getHours();
    let timeGreeting = "Good day";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    const greetings = [
        `${timeGreeting}. JARVIS at your service. How may I assist with your studies today?`,
        `${timeGreeting}. All systems operational. What shall we work on?`,
        `${timeGreeting}. I'm ready to help optimize your learning experience.`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}
function getHelpMessage() {
    return `Certainly. Here are my capabilities:

📚 **Flashcard Generation**: "Create 10 flashcards about photosynthesis"
🧠 **Knowledge Testing**: "Quiz me on World War 2"
💡 **Concept Explanation**: "Explain quantum entanglement"
📝 **Content Summarization**: "Summarize [paste content]"
📍 **App Navigation**: "Go to planner" or "Open materials"
✅ **Task Management**: "Add task: Study for math exam"
🔖 **Memory Storage**: "Remember that the test is on Friday"
🔍 **Material Search**: "What do I have on biology?"

Simply state your request naturally, and I shall endeavor to assist.`;
}
function getSuggestedActions(context) {
    const suggestions = [];
    switch(context.currentPage){
        case "flashcards":
            suggestions.push("Create flashcards about...");
            suggestions.push("Quiz me on my decks");
            break;
        case "materials":
            suggestions.push("Summarize my notes");
            suggestions.push("Create flashcards from materials");
            break;
        case "planner":
            suggestions.push("What's due this week?");
            suggestions.push("Add a study task");
            break;
        default:
            suggestions.push("Create flashcards");
            suggestions.push("Quiz me");
            suggestions.push("Explain a concept");
    }
    return suggestions;
}
}),
"[project]/lib/jarvis/commandParser.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JarvisCommandParser",
    ()=>JarvisCommandParser,
    "getCommandParser",
    ()=>getCommandParser
]);
"use client";
class JarvisCommandParser {
    COMMAND_PATTERNS = {
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
    };
    INTENT_MAPPING = {
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
    };
    parseCommand(command, context) {
        const normalizedCommand = command.toLowerCase().trim();
        // Try to match against patterns
        for (const [intentKey, patterns] of Object.entries(this.COMMAND_PATTERNS)){
            for (const pattern of patterns){
                const match = normalizedCommand.match(pattern);
                if (match) {
                    const parsed = this.buildParsedCommand(intentKey, match, command);
                    if (parsed.confidence > 0.3) {
                        // Add multi-step logic if needed
                        if (parsed.multiStep) {
                            parsed.steps = this.generateSteps(parsed, context);
                        }
                        return parsed;
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
        };
    }
    buildParsedCommand(intentKey, match, originalCommand) {
        const intent = this.INTENT_MAPPING[intentKey] || intentKey;
        const entities = {};
        let confidence = 0.8;
        switch(intentKey){
            case 'create_task':
                entities.title = match[1] || match[2] || match[3];
                entities.dueDate = this.parseDate(match[4] || match[5]);
                entities.course = match[6];
                break;
            case 'complete_task':
                entities.taskName = match[1] || match[2];
                break;
            case 'show_tasks':
                entities.filter = match[1] || match[2] ? {
                    course: match[1],
                    dueDate: match[2]
                } : null;
                break;
            case 'start_study':
                entities.task = match[1] || match[2];
                entities.duration = match[3] || match[4] ? parseInt(match[3] || match[4]) : 25;
                break;
            case 'complete_habit':
                entities.habitName = match[1] || match[2] || match[3];
                break;
            case 'show_course':
                entities.courseName = match[1] || match[2] || match[3];
                break;
            case 'find_material':
                entities.topic = match[1] || match[2] || match[3];
                entities.course = match[4];
                break;
            case 'schedule_event':
                entities.title = match[1] || match[4];
                entities.dateTime = this.parseDate(match[2] || match[5]);
                entities.participants = match[3] || match[6];
                break;
            case 'study_plan':
                entities.examName = match[1] || match[2];
                entities.days = match[3] || match[4] ? parseInt(match[3] || match[4]) : 7;
                confidence = 0.9;
                break;
            case 'productivity_session':
                entities.duration = match[1] ? this.parseDuration(match[1]) : 90;
                confidence = 0.9;
                break;
            default:
                confidence = 0.5;
        }
        return {
            intent,
            entities,
            confidence,
            originalCommand,
            multiStep: [
                'study_plan',
                'productivity_session'
            ].includes(intentKey),
            requiresConfirmation: confidence < 0.7
        };
    }
    generateSteps(parsed, context) {
        const steps = [];
        switch(parsed.intent){
            case 'plan.create':
                steps.push({
                    id: 'gather_requirements',
                    action: 'analyze_course_materials',
                    params: {
                        examName: parsed.entities.examName
                    },
                    description: 'Analyzing course materials and syllabus'
                }, {
                    id: 'assess_current_progress',
                    action: 'check_completion_status',
                    params: {
                        course: parsed.entities.examName
                    },
                    description: 'Checking current progress and completed topics'
                }, {
                    id: 'calculate_study_load',
                    action: 'estimate_time_needed',
                    params: {
                        days: parsed.entities.days,
                        course: parsed.entities.examName
                    },
                    description: 'Calculating optimal study time distribution'
                }, {
                    id: 'generate_schedule',
                    action: 'create_study_plan',
                    params: {
                        days: parsed.entities.days,
                        course: parsed.entities.examName
                    },
                    description: 'Creating detailed study schedule',
                    dependsOn: [
                        'gather_requirements',
                        'assess_current_progress',
                        'calculate_study_load'
                    ]
                }, {
                    id: 'create_tasks',
                    action: 'schedule_tasks',
                    params: {
                        planId: '{{generate_schedule.result}}'
                    },
                    description: 'Adding study tasks to your planner',
                    dependsOn: [
                        'generate_schedule'
                    ]
                });
                break;
            case 'productivity.start':
                steps.push({
                    id: 'prepare_environment',
                    action: 'setup_focus_mode',
                    params: {
                        duration: parsed.entities.duration
                    },
                    description: 'Setting up distraction-free environment'
                }, {
                    id: 'select_task',
                    action: 'choose_next_task',
                    params: {},
                    description: 'Selecting the most important task to focus on',
                    requiresUserInput: true
                }, {
                    id: 'start_timer',
                    action: 'begin_pomodoro',
                    params: {
                        taskId: '{{select_task.result}}',
                        duration: parsed.entities.duration
                    },
                    description: 'Starting focused work session',
                    dependsOn: [
                        'prepare_environment',
                        'select_task'
                    ]
                }, {
                    id: 'monitor_progress',
                    action: 'track_session',
                    params: {
                        sessionId: '{{start_timer.result}}'
                    },
                    description: 'Monitoring your progress and providing encouragement'
                });
                break;
        }
        return steps;
    }
    parseDate(dateStr) {
        if (!dateStr) return null;
        // Simple date parsing - could be enhanced with a proper date library
        const today = new Date();
        const lowerStr = dateStr.toLowerCase();
        if (lowerStr.includes('tomorrow')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return tomorrow;
        }
        if (lowerStr.includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            return nextWeek;
        }
        if (lowerStr.includes('end of week') || lowerStr.includes('friday')) {
            const friday = new Date(today);
            const daysUntilFriday = (5 - today.getDay() + 7) % 7;
            friday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
            return friday;
        }
        // Try to parse as a specific date
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        return null;
    }
    parseDuration(durationStr) {
        const match = durationStr.match(/(\d+)\s*(min|minutes?|hours?)/i);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            return unit.startsWith('hour') ? value * 60 : value;
        }
        return 25 // Default 25 minutes
        ;
    }
    // Utility method to get suggested commands based on context
    getSuggestedCommands(context) {
        const suggestions = [];
        if (context?.currentPage === 'dashboard') {
            suggestions.push("Start a study session", "Show my tasks", "Complete a habit", "Create a study plan");
        }
        if (context?.currentPage === 'planner') {
            suggestions.push("Create a new task", "Show tasks due today", "Schedule an event");
        }
        if (context?.availableData?.tasks && context.availableData.tasks.length > 0) {
            suggestions.push("Show my tasks");
        }
        if (context?.availableData?.habits && context.availableData.habits.length > 0) {
            suggestions.push("Show my habits");
        }
        return suggestions.slice(0, 4) // Return top 4 suggestions
        ;
    }
}
// Singleton instance
let commandParser = null;
function getCommandParser() {
    if (!commandParser) {
        commandParser = new JarvisCommandParser();
    }
    return commandParser;
}
}),
"[project]/lib/jarvis/materials-integration.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MaterialSearchIntegration",
    ()=>MaterialSearchIntegration,
    "getMaterialSearchIntegration",
    ()=>getMaterialSearchIntegration,
    "useMaterialSearch",
    ()=>useMaterialSearch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firestore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth-provider.tsx [app-ssr] (ecmascript)");
"use client";
;
;
class MaterialSearchIntegration {
    materials = [];
    userId;
    constructor(userId){
        this.userId = userId;
    }
    async initialize() {
        try {
            this.materials = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaterials"])(this.userId);
        } catch (error) {
            console.error('Failed to load materials for search:', error);
            this.materials = [];
        }
    }
    async search(query, options = {}) {
        const { limit = 10, types, tags } = options;
        if (!query.trim()) {
            return [];
        }
        // Ensure materials are loaded
        if (this.materials.length === 0) {
            await this.initialize();
        }
        const queryLower = query.toLowerCase();
        const results = [];
        for (const material of this.materials){
            // Filter by type if specified
            if (types && types.length > 0 && !types.includes(material.type)) {
                continue;
            }
            // Filter by subject/tags if specified
            if (tags && tags.length > 0) {
                const materialSubject = material.subject || '';
                if (!tags.some((tag)=>materialSubject.toLowerCase().includes(tag.toLowerCase()))) {
                    continue;
                }
            }
            let relevanceScore = 0;
            let excerpt = '';
            // Search in title (highest weight)
            if (material.title.toLowerCase().includes(queryLower)) {
                relevanceScore += 10;
                excerpt = this.extractExcerpt(material.title, queryLower);
            }
            // Search in content
            if (material.content && material.content.toLowerCase().includes(queryLower)) {
                relevanceScore += 5;
                if (!excerpt) {
                    excerpt = this.extractExcerpt(material.content, queryLower);
                }
            }
            // Search in subject
            if (material.subject && material.subject.toLowerCase().includes(queryLower)) {
                relevanceScore += 3;
                if (!excerpt) {
                    excerpt = `Subject: ${material.subject}`;
                }
            }
            // Boost score for exact matches
            if (material.title.toLowerCase() === queryLower) {
                relevanceScore += 20;
            }
            if (relevanceScore > 0) {
                results.push({
                    id: material.id,
                    name: material.title,
                    type: material.type,
                    content: material.content || '',
                    tags: [
                        material.subject
                    ],
                    relevanceScore,
                    excerpt: excerpt || material.title
                });
            }
        }
        // Sort by relevance score (descending)
        results.sort((a, b)=>b.relevanceScore - a.relevanceScore);
        return results.slice(0, limit);
    }
    extractExcerpt(text, query, contextLength = 50) {
        const index = text.toLowerCase().indexOf(query);
        if (index === -1) return text.substring(0, contextLength) + '...';
        const start = Math.max(0, index - contextLength / 2);
        const end = Math.min(text.length, index + query.length + contextLength / 2);
        let excerpt = text.substring(start, end);
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';
        return excerpt;
    }
    getAvailableTypes() {
        const types = new Set(this.materials.map((m)=>m.type));
        return Array.from(types);
    }
    getAvailableTags() {
        const tags = new Set();
        this.materials.forEach((material)=>{
            if (material.subject) {
                tags.add(material.subject);
            }
        });
        return Array.from(tags);
    }
    getMaterialCount() {
        return this.materials.length;
    }
}
// Singleton instance for the current user
let materialSearchInstance = null;
function getMaterialSearchIntegration(userId) {
    if (!materialSearchInstance || materialSearchInstance['userId'] !== userId) {
        materialSearchInstance = new MaterialSearchIntegration(userId);
    }
    return materialSearchInstance;
}
function useMaterialSearch() {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthContext"])();
    const searchMaterials = async (query, options)=>{
        if (!user) return [];
        const searchIntegration = getMaterialSearchIntegration(user.uid);
        return await searchIntegration.search(query, options);
    };
    const initializeSearch = async ()=>{
        if (!user) return;
        const searchIntegration = getMaterialSearchIntegration(user.uid);
        await searchIntegration.initialize();
    };
    return {
        searchMaterials,
        initializeSearch
    };
}
}),
"[project]/lib/jarvis/commandExecutor.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JarvisCommandExecutor",
    ()=>JarvisCommandExecutor,
    "getCommandExecutor",
    ()=>getCommandExecutor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firestore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$materials$2d$integration$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/jarvis/materials-integration.ts [app-ssr] (ecmascript)");
"use client";
;
;
class JarvisCommandExecutor {
    executionStates = new Map();
    API_BRIDGES = {
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
    };
    async executeCommand(command, context) {
        const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (command.multiStep && command.steps) {
            return this.executeMultiStepCommand(commandId, command, context);
        } else {
            return this.executeSingleCommand(command, context);
        }
    }
    async executeSingleCommand(command, context) {
        const bridge = this.API_BRIDGES[command.intent];
        if (!bridge) {
            return {
                success: false,
                message: `I don't know how to handle "${command.intent}" commands yet.`
            };
        }
        try {
            return await bridge(command.entities, context);
        } catch (error) {
            console.error('Command execution error:', error);
            return {
                success: false,
                message: `Sorry, I encountered an error while executing that command. Please try again.`
            };
        }
    }
    async executeMultiStepCommand(commandId, command, context) {
        if (!command.steps) {
            return {
                success: false,
                message: 'No steps defined for multi-step command'
            };
        }
        const state = {
            commandId,
            currentStep: 0,
            totalSteps: command.steps.length,
            results: {},
            status: 'running'
        };
        this.executionStates.set(commandId, state);
        try {
            for(let i = 0; i < command.steps.length; i++){
                const step = command.steps[i];
                state.currentStep = i;
                // Check dependencies
                if (step.dependsOn) {
                    const missingDeps = step.dependsOn.filter((dep)=>!state.results[dep]);
                    if (missingDeps.length > 0) {
                        state.status = 'failed';
                        state.error = `Missing dependencies: ${missingDeps.join(', ')}`;
                        break;
                    }
                }
                // Execute step
                const stepResult = await this.executeStep(step, state.results, context);
                if (!stepResult.success) {
                    state.status = 'failed';
                    state.error = stepResult.message;
                    break;
                }
                state.results[step.id] = stepResult.data;
                // Handle user input requirements
                if (stepResult.requiresUserInput) {
                    state.status = 'waiting';
                    return {
                        success: true,
                        message: stepResult.userInputPrompt || 'Please provide additional information',
                        requiresUserInput: true,
                        nextStep: step.id
                    };
                }
            }
            state.status = 'completed';
            return {
                success: true,
                message: this.generateCompletionMessage(command, state.results),
                data: state.results
            };
        } catch (error) {
            state.status = 'failed';
            state.error = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                message: 'Command execution failed. Please try again.'
            };
        }
    }
    async executeStep(step, previousResults, context) {
        // Replace template variables
        const params = this.resolveTemplateVariables(step.params, previousResults);
        const bridge = this.API_BRIDGES[step.action];
        if (!bridge) {
            return {
                success: false,
                message: `Unknown action: ${step.action}`
            };
        }
        return await bridge(params, context);
    }
    resolveTemplateVariables(params, results) {
        const resolved = {
            ...params
        };
        for (const [key, value] of Object.entries(resolved)){
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const templateKey = value.slice(2, -2);
                const [resultKey, property] = templateKey.split('.');
                if (results[resultKey]) {
                    resolved[key] = property ? results[resultKey][property] : results[resultKey];
                }
            }
        }
        return resolved;
    }
    // API Bridge Implementations
    async createTask(entities, context) {
        try {
            const taskData = {
                userId: context.userId,
                title: entities.title,
                description: entities.description || '',
                priority: entities.priority || 'medium',
                status: 'todo',
                dueDate: entities.dueDate,
                course: entities.course,
                estimatedMinutes: entities.duration || 30,
                tags: entities.tags || [],
                subtasks: [],
                links: []
            };
            const taskId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTask"])(taskData);
            return {
                success: true,
                message: `Created task "${entities.title}"${entities.dueDate ? ` due ${entities.dueDate.toLocaleDateString()}` : ''}`,
                data: {
                    taskId
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to create task. Please try again.'
            };
        }
    }
    async completeTask(entities, context) {
        try {
            const tasks = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTasks"])(context.userId);
            const task = tasks.find((t)=>t.title.toLowerCase().includes(entities.taskName.toLowerCase()));
            if (!task) {
                return {
                    success: false,
                    message: `I couldn't find a task named "${entities.taskName}". Could you be more specific?`
                };
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateTask"])(task.id, {
                status: 'done',
                completedAt: new Date()
            });
            return {
                success: true,
                message: `Marked "${task.title}" as completed! Great job! 🎉`,
                data: {
                    taskId: task.id
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to complete task. Please try again.'
            };
        }
    }
    async listTasks(entities, context) {
        try {
            const tasks = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTasks"])(context.userId);
            let filteredTasks = tasks;
            if (entities.filter) {
                if (entities.filter.course) {
                    filteredTasks = filteredTasks.filter((t)=>t.course?.toLowerCase().includes(entities.filter.course.toLowerCase()));
                }
                if (entities.filter.dueDate) {
                    const filterDate = new Date(entities.filter.dueDate);
                    filteredTasks = filteredTasks.filter((t)=>t.dueDate && new Date(t.dueDate) <= filterDate);
                }
            }
            const pendingTasks = filteredTasks.filter((t)=>t.status !== 'done');
            if (pendingTasks.length === 0) {
                return {
                    success: true,
                    message: 'You have no pending tasks! 🎉',
                    data: {
                        tasks: []
                    }
                };
            }
            const taskList = pendingTasks.slice(0, 5).map((t)=>`- ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ''}`).join('\n');
            return {
                success: true,
                message: `Here are your ${entities.filter ? 'filtered ' : ''}tasks:\n${taskList}${pendingTasks.length > 5 ? `\n...and ${pendingTasks.length - 5} more` : ''}`,
                data: {
                    tasks: pendingTasks
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve tasks. Please try again.'
            };
        }
    }
    async startStudySession(entities, context) {
        // This would integrate with the Pomodoro timer
        return {
            success: true,
            message: `Starting a ${entities.duration || 25} minute study session${entities.task ? ` for "${entities.task}"` : ''}. Focus mode activated! 🚀`,
            data: {
                duration: entities.duration || 25,
                task: entities.task
            }
        };
    }
    async completeHabit(entities, context) {
        try {
            const habits = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getHabits"])(context.userId);
            const habit = habits.find((h)=>h.name.toLowerCase().includes(entities.habitName.toLowerCase()));
            if (!habit) {
                return {
                    success: false,
                    message: `I couldn't find a habit named "${entities.habitName}". Could you be more specific?`
                };
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleHabitCompletion"])(habit.id, new Date().toISOString().split('T')[0]);
            return {
                success: true,
                message: `Completed "${habit.name}" for today! Keep up the great work! 💪`,
                data: {
                    habitId: habit.id
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to complete habit. Please try again.'
            };
        }
    }
    async listHabits(entities, context) {
        try {
            const habits = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getHabits"])(context.userId);
            const today = new Date().toISOString().split('T')[0];
            const habitStatus = habits.map((h)=>{
                const completedToday = h.completions.some((c)=>c.date === today && c.completed);
                return `- ${h.name}: ${completedToday ? '✅ Done' : '⏳ Pending'} (${h.currentStreak} day streak)`;
            }).join('\n');
            return {
                success: true,
                message: `Here's your habit status:\n${habitStatus}`,
                data: {
                    habits
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve habits. Please try again.'
            };
        }
    }
    async getCourseInfo(entities, context) {
        try {
            const courses = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCourses"])(context.userId);
            const course = courses.find((c)=>c.name.toLowerCase().includes(entities.courseName.toLowerCase()));
            if (!course) {
                return {
                    success: false,
                    message: `I couldn't find a course named "${entities.courseName}".`
                };
            }
            const info = `Course: ${course.name}${course.code ? ` (${course.code})` : ''}${course.professor ? `\nProfessor: ${course.professor}` : ''}${course.examDate ? `\nNext Exam: ${new Date(course.examDate).toLocaleDateString()}` : ''}`;
            return {
                success: true,
                message: info,
                data: {
                    course
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve course information.'
            };
        }
    }
    async searchMaterials(entities, context) {
        try {
            const searchIntegration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$materials$2d$integration$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaterialSearchIntegration"])(context.userId);
            await searchIntegration.initialize();
            const query = entities.topic || entities.query || '';
            const results = await searchIntegration.search(query, {
                limit: 5,
                types: entities.type ? [
                    entities.type
                ] : undefined,
                tags: entities.tags ? entities.tags.split(',').map((t)=>t.trim()) : undefined
            });
            if (results.length === 0) {
                return {
                    success: false,
                    message: `I couldn't find any materials related to "${query}". ${searchIntegration.getMaterialCount() > 0 ? 'Try a different search term or check your materials.' : 'You haven\'t uploaded any materials yet.'}`
                };
            }
            const materialList = results.map((r)=>`- ${r.name} (${r.type}) - ${r.excerpt}`).join('\n');
            return {
                success: true,
                message: `Found ${results.length} material${results.length > 1 ? 's' : ''} related to "${query}":\n${materialList}`,
                data: {
                    materials: results
                }
            };
        } catch (error) {
            console.error('Material search error:', error);
            return {
                success: false,
                message: 'Failed to search materials. Please try again.'
            };
        }
    }
    async createCalendarEvent(entities, context) {
        try {
            const eventData = {
                userId: context.userId,
                title: entities.title,
                type: 'meeting',
                startTime: entities.dateTime || new Date(),
                endTime: new Date((entities.dateTime || new Date()).getTime() + 60 * 60 * 1000),
                isAllDay: false,
                isRecurring: false,
                description: entities.description || '',
                color: '#3b82f6'
            };
            const eventId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createCalendarEvent"])(eventData);
            return {
                success: true,
                message: `Scheduled "${entities.title}" for ${entities.dateTime?.toLocaleString() || 'now'}`,
                data: {
                    eventId
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to schedule event.'
            };
        }
    }
    async showAnalytics(entities, context) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const dailyStats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDailyStats"])(context.userId, today);
            if (!dailyStats) {
                return {
                    success: true,
                    message: "You haven't logged any study time today yet. Let's get started! 📚",
                    data: {
                        stats: null
                    }
                };
            }
            const message = `Today's Progress:\n` + `📖 Study Time: ${Math.round(dailyStats.totalStudyMinutes / 60 * 10) / 10}h\n` + `✅ Tasks Completed: ${dailyStats.taskCompleted}\n` + `🎯 Pomodoro Sessions: ${dailyStats.pomodoroCompleted}\n` + `🔥 Current Streak: ${dailyStats.streakDay} days`;
            return {
                success: true,
                message,
                data: {
                    stats: dailyStats
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to retrieve analytics.'
            };
        }
    }
    // Multi-step command implementations
    async createStudyPlan(entities, context) {
        // This is a multi-step command that will be handled by the multi-step executor
        return {
            success: true,
            message: 'Starting study plan creation...',
            data: {
                examName: entities.examName,
                days: entities.days
            }
        };
    }
    async startProductivitySession(entities, context) {
        // This is a multi-step command that will be handled by the multi-step executor
        return {
            success: true,
            message: 'Initiating productivity session...',
            data: {
                duration: entities.duration
            }
        };
    }
    // Sub-action implementations for multi-step commands
    async analyzeCourseMaterials(entities, context) {
        try {
            const courses = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCourses"])(context.userId);
            const course = courses.find((c)=>c.name.toLowerCase().includes(entities.examName.toLowerCase()));
            return {
                success: true,
                message: 'Analyzed course materials',
                data: {
                    course,
                    materials: course?.syllabus || []
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to analyze course materials'
            };
        }
    }
    async checkCompletionStatus(entities, context) {
        try {
            const tasks = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTasks"])(context.userId);
            const courseTasks = tasks.filter((t)=>t.course?.toLowerCase().includes(entities.course.toLowerCase()));
            const completedTasks = courseTasks.filter((t)=>t.status === 'done');
            return {
                success: true,
                message: 'Checked completion status',
                data: {
                    completed: completedTasks.length,
                    total: courseTasks.length,
                    progress: completedTasks.length / courseTasks.length
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to check completion status'
            };
        }
    }
    async estimateTimeNeeded(entities, context) {
        const estimatedHours = Math.max(entities.days * 2, 10) // At least 10 hours, or 2 hours per day
        ;
        return {
            success: true,
            message: 'Estimated study time needed',
            data: {
                estimatedHours,
                dailyHours: estimatedHours / entities.days
            }
        };
    }
    async createStudyPlanAction(entities, context) {
        try {
            // Generate a simple study plan structure
            const plan = {
                id: `plan_${Date.now()}`,
                examName: entities.course,
                days: entities.days,
                dailyTasks: Math.ceil(10 / entities.days),
                focusAreas: [
                    'Review notes',
                    'Practice problems',
                    'Take breaks',
                    'Light review'
                ]
            };
            return {
                success: true,
                message: 'Generated study plan',
                data: {
                    plan,
                    planId: `plan_${Date.now()}`
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to generate study plan'
            };
        }
    }
    async scheduleTasks(entities, context) {
        // This would create actual tasks in the system
        return {
            success: true,
            message: 'Scheduled study tasks',
            data: {
                taskCount: 5
            } // Placeholder
        };
    }
    async setupFocusMode(entities, context) {
        return {
            success: true,
            message: 'Focus mode activated - notifications silenced, distractions minimized',
            data: {
                focusMode: true
            }
        };
    }
    async chooseNextTask(entities, context) {
        try {
            const tasks = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTasks"])(context.userId);
            const pendingTasks = tasks.filter((t)=>t.status !== 'done').sort((a, b)=>{
                const priorityOrder = {
                    urgent: 0,
                    high: 1,
                    medium: 2,
                    low: 3
                };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            if (pendingTasks.length === 0) {
                return {
                    success: true,
                    message: 'No pending tasks found',
                    data: {
                        task: null
                    }
                };
            }
            return {
                success: true,
                message: `Selected: "${pendingTasks[0].title}"`,
                data: {
                    task: pendingTasks[0]
                },
                requiresUserInput: true,
                userInputPrompt: `Would you like to work on "${pendingTasks[0].title}" or choose a different task?`
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to select task'
            };
        }
    }
    async beginPomodoro(entities, context) {
        return {
            success: true,
            message: `Starting ${entities.duration} minute focus session on "${entities.taskId?.title || 'selected task'}"`,
            data: {
                sessionId: `session_${Date.now()}`,
                duration: entities.duration
            }
        };
    }
    async trackSession(entities, context) {
        return {
            success: true,
            message: 'Session tracking active - I\'ll keep you motivated!',
            data: {
                tracking: true
            }
        };
    }
    generateCompletionMessage(command, results) {
        switch(command.intent){
            case 'plan.create':
                return `✅ Study plan created! I've scheduled ${results.schedule_tasks?.taskCount || 5} study sessions over ${command.entities.days} days. Check your planner for details.`;
            case 'productivity.start':
                return `🚀 Productivity session started! ${command.entities.duration} minutes of focused work ahead. You've got this!`;
            default:
                return '✅ Command completed successfully!';
        }
    }
    // Utility methods
    getExecutionState(commandId) {
        return this.executionStates.get(commandId) || null;
    }
    cancelExecution(commandId) {
        const state = this.executionStates.get(commandId);
        if (state) {
            state.status = 'failed';
            state.error = 'Cancelled by user';
        }
    }
}
// Singleton instance
let commandExecutor = null;
function getCommandExecutor() {
    if (!commandExecutor) {
        commandExecutor = new JarvisCommandExecutor();
    }
    return commandExecutor;
}
}),
"[project]/components/jarvis-assistant.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JarvisAssistant",
    ()=>JarvisAssistant
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth-provider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assistant$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/assistant.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$commandParser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/jarvis/commandParser.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$commandExecutor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/jarvis/commandExecutor.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firestore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/book-open.js [app-ssr] (ecmascript) <export default as BookOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.js [app-ssr] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lightbulb.js [app-ssr] (ecmascript) <export default as Lightbulb>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Navigation$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/navigation.js [app-ssr] (ecmascript) <export default as Navigation>");
"use client";
;
;
;
;
;
;
;
;
;
;
;
function JarvisAssistant({ context } = {}) {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthContext"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isFullscreen, setIsFullscreen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [inputValue, setInputValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [userContext, setUserContext] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        currentPage: context?.currentPage || pathname,
        conversationHistory: [],
        userMaterials: [],
        userDecks: []
    });
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showWaveform, setShowWaveform] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [userDecks, setUserDecks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isVoiceNotesMode, setIsVoiceNotesMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [voiceNotes, setVoiceNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [speakOnlyIntro, setSpeakOnlyIntro] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [globalVoiceActive, setGlobalVoiceActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Voice input hook
    const { state: voiceState, startListening, stopListening, resetTranscript } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useVoiceInput"])({
        continuous: true,
        onResult: (transcript, isFinal)=>{
            if (isVoiceNotesMode) {
                setVoiceNotes((prev)=>prev + (isFinal ? transcript : ""));
                if (isFinal) {
                    addAssistantMessage(`Voice note added: "${transcript}"`);
                }
            } else {
                if (isFinal && transcript.trim()) {
                    setInputValue(transcript.trim());
                    handleSubmit(transcript.trim());
                }
            }
        },
        onError: (error)=>{
            addAssistantMessage(`Voice recognition error: ${error}`);
        }
    });
    // Load user context
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function loadContext() {
            if (!user) return;
            try {
                const [materials, decks] = await Promise.all([
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMaterials"])(user.uid),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firestore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFlashcardDecks"])(user.uid)
                ]);
                setUserDecks(decks);
                setUserContext({
                    userId: user.uid,
                    currentPage: pathname,
                    userMaterials: materials.map((m)=>({
                            id: m.id,
                            title: m.title,
                            subject: m.subject
                        })),
                    userDecks: decks.map((d)=>({
                            id: d.id,
                            name: d.name
                        }))
                });
            } catch (error) {
                console.error("Error loading context:", error);
            }
        }
        loadContext();
    }, [
        user,
        pathname
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setUserContext((prev)=>({
                ...prev,
                currentPage: pathname
            }));
    }, [
        pathname
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [
        messages
    ]);
    // Global voice activation for "gemini"
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSpeechRecognitionSupported"])()) return;
        let globalRecognition = null;
        const startGlobalListening = ()=>{
            if (globalRecognition) return;
            globalRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            globalRecognition.continuous = true;
            globalRecognition.interimResults = false;
            globalRecognition.lang = "en-US";
            globalRecognition.onresult = (event)=>{
                const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                if (transcript.includes("gemini") || transcript.includes("jarvis") || transcript.includes("hey jarvis")) {
                    setIsOpen(true);
                    setGlobalVoiceActive(true);
                    globalRecognition.stop();
                    // Start the main voice input
                    setTimeout(()=>{
                        startListening();
                        setShowWaveform(true);
                    }, 500);
                }
            };
            globalRecognition.onend = ()=>{
                setGlobalVoiceActive(false);
                // Restart global listening if not activated
                setTimeout(startGlobalListening, 1000);
            };
            globalRecognition.start();
        };
        if (!isOpen) {
            startGlobalListening();
        }
        return ()=>{
            if (globalRecognition) {
                globalRecognition.stop();
            }
        };
    }, [
        isOpen,
        startListening
    ]);
    // Stop speaking when component unmounts or closes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        };
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isOpen) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        }
    }, [
        isOpen
    ]);
    // Generate proactive contextual greeting
    const getContextualGreeting = ()=>{
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        let greeting = `Good ${timeOfDay}! I'm JARVIS, your intelligent study assistant.`;
        let suggestion = "";
        // Proactive suggestions based on context
        if (context?.todayTasks && context.todayTasks.length > 0) {
            const urgentTasks = context.todayTasks.filter((t)=>t.priority === 'urgent');
            const highTasks = context.todayTasks.filter((t)=>t.priority === 'high');
            if (urgentTasks.length > 0) {
                suggestion = `⚡ You have ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} - shall I help you prioritize?`;
            } else if (highTasks.length > 0) {
                suggestion = `📋 ${context.todayTasks.length} tasks today. Ready to start a focus session?`;
            } else {
                suggestion = `You have ${context.todayTasks.length} task${context.todayTasks.length > 1 ? 's' : ''} scheduled. How can I help?`;
            }
        } else if (context?.habits && context.habits.length > 0) {
            const incompleteHabits = context.habits.filter((h)=>{
                const todayStr = new Date().toISOString().split('T')[0];
                return !h.completions.some((c)=>c.date === todayStr && c.completed);
            });
            if (incompleteHabits.length > 0) {
                suggestion = `🔥 ${incompleteHabits.length} habit${incompleteHabits.length > 1 ? 's' : ''} pending today. Want help staying on track?`;
            }
        }
        // Time-based suggestions
        if (!suggestion) {
            if (hour >= 9 && hour <= 11) {
                suggestion = "🧠 Morning peak focus time! Shall I help you plan a deep work session?";
            } else if (hour >= 14 && hour <= 16) {
                suggestion = "💪 Afternoon productivity window. Ready to tackle something challenging?";
            } else if (hour >= 20 && hour <= 22) {
                suggestion = "🌙 Good time for review. Want me to suggest flashcards to review?";
            } else {
                suggestion = "How may I assist you today?";
            }
        }
        return `${greeting}\n\n${suggestion}`;
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isOpen && !isInitialized) {
            setIsInitialized(true);
            // Jarvis greeting with contextual awareness
            setTimeout(()=>{
                addAssistantMessage(getContextualGreeting());
            }, 500);
        }
    }, [
        isOpen,
        isInitialized,
        context
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [
        isOpen
    ]);
    // Update waveform state based on voice
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setShowWaveform(voiceState.isListening);
    }, [
        voiceState.isListening
    ]);
    const getTimeOfDay = ()=>{
        const hour = new Date().getHours();
        if (hour < 12) return "morning";
        if (hour < 17) return "afternoon";
        return "evening";
    };
    const addAssistantMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((content, action)=>{
        const message = {
            id: Date.now().toString(),
            role: "assistant",
            content,
            timestamp: new Date(),
            action
        };
        setMessages((prev)=>[
                ...prev,
                message
            ]);
        // Determine what to speak
        let speakText = content;
        if (speakOnlyIntro) {
            // Extract introduction/summary (first sentence or first 100 characters)
            const firstSentence = content.split(/[.!?]/)[0];
            if (firstSentence && firstSentence.length > 10) {
                speakText = firstSentence + (firstSentence.length < content.length ? "..." : "");
            } else {
                // Fallback to first 100 characters
                speakText = content.length > 100 ? content.substring(0, 100) + "..." : content;
            }
        }
        // Speak the response (softer, more natural voice)
        try {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["speak"])(speakText, {
                rate: 1.0,
                pitch: 1.0,
                volume: 0.7
            }).catch(()=>{});
        } catch  {}
        return message;
    }, [
        speakOnlyIntro
    ]);
    const handleSubmit = async (text)=>{
        const messageText = (text || inputValue).trim();
        if (!messageText || isProcessing) return;
        setInputValue("");
        setIsProcessing(true);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: messageText,
            timestamp: new Date()
        };
        setMessages((prev)=>[
                ...prev,
                userMessage
            ]);
        try {
            // Use new command parser and executor
            const commandParser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$commandParser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCommandParser"])();
            const commandExecutor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$commandExecutor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCommandExecutor"])();
            const commandContext = {
                userId: user?.uid || '',
                currentPage: pathname,
                recentActions: [],
                userPreferences: {},
                availableData: {
                    tasks: context?.todayTasks,
                    courses: context?.courses,
                    habits: context?.habits
                }
            };
            const parsedCommand = commandParser.parseCommand(messageText, commandContext);
            const result = await commandExecutor.executeCommand(parsedCommand, commandContext);
            addAssistantMessage(result.message);
            // Handle actions from new executor
            if (result.data) {
                // Handle navigation actions
                if (result.data.path) {
                    setTimeout(()=>{
                        router.push(result.data.path);
                    }, 1000);
                }
                // Handle task creation
                if (result.data.taskId && parsedCommand.intent === 'task.create') {
                // Could refresh tasks here
                }
                // Handle habit completion
                if (result.data.habitId && parsedCommand.intent === 'habit.complete') {
                // Could refresh habits here
                }
            }
            // Handle multi-step command continuation
            if (result.requiresUserInput) {
                // For now, just acknowledge - could be enhanced to handle follow-up questions
                addAssistantMessage("What would you like to do next?", {
                    type: "none",
                    data: {
                        commandId: result.nextStep
                    }
                });
            }
        } catch (error) {
            addAssistantMessage(`I apologize, but I encountered an error: ${error.message}`);
        } finally{
            setIsProcessing(false);
        }
    };
    const handleVoiceToggle = ()=>{
        if (voiceState.isListening) {
            stopListening();
        } else {
            resetTranscript();
            startListening();
        }
    };
    const clearChat = ()=>{
        setMessages([]);
        addAssistantMessage("Memory cleared. How may I assist you?");
    };
    const suggestions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$assistant$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSuggestedActions"])(userContext);
    if (!user) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(!isOpen),
                "aria-label": "Open JARVIS",
                className: "jsx-97cb4c3eb5ceaed4" + " " + `fixed bottom-6 right-6 z-50 group transition-all duration-500 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "jsx-97cb4c3eb5ceaed4" + " " + "relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 w-16 h-16 rounded-full bg-blue-400/20 animate-ping"
                        }, void 0, false, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 397,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 w-16 h-16 rounded-full bg-blue-400/10 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 398,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/30 flex items-center justify-center overflow-hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-2 rounded-full bg-gradient-to-br from-blue-300/50 to-transparent"
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 403,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "relative w-8 h-8 rounded-full bg-gradient-to-br from-white via-blue-100 to-blue-200 shadow-inner flex items-center justify-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-4 h-4 rounded-full bg-white/90 animate-pulse"
                                    }, void 0, false, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 407,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 406,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 401,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-mono",
                            children: "JARVIS"
                        }, void 0, false, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 412,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/jarvis-assistant.tsx",
                    lineNumber: 395,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/jarvis-assistant.tsx",
                lineNumber: 388,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-97cb4c3eb5ceaed4" + " " + `fixed z-50 transition-all duration-500 ease-out ${isFullscreen ? "inset-4" : "bottom-6 right-6 w-[420px] max-w-[calc(100vw-3rem)]"} ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "jsx-97cb4c3eb5ceaed4" + " " + `relative h-full ${isFullscreen ? "" : "max-h-[600px]"} bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-2xl overflow-hidden flex flex-col`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 rounded-2xl overflow-hidden pointer-events-none",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 animate-shimmer"
                            }, void 0, false, {
                                fileName: "[project]/components/jarvis-assistant.tsx",
                                lineNumber: 434,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 433,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "relative px-5 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-97cb4c3eb5ceaed4" + " " + `w-6 h-6 rounded-full bg-blue-300/80 ${isProcessing ? "animate-pulse" : ""}`,
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "w-full h-full rounded-full bg-gradient-to-br from-white/60 to-transparent"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 445,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/jarvis-assistant.tsx",
                                                                lineNumber: 444,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 443,
                                                            columnNumber: 19
                                                        }, this),
                                                        isProcessing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 449,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 442,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "font-bold text-blue-600 tracking-wider font-mono text-sm",
                                                            children: "Study AI Assistant"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 454,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-[10px] text-blue-500 font-mono tracking-widest",
                                                            children: "J.A.R.V.I.S - Intelligent Study Companion"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 455,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 453,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 440,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200/50",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "w-2 h-2 rounded-full bg-green-400 animate-pulse"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 462,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-[10px] text-green-600 font-mono",
                                                            children: "ACTIVE"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 463,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 461,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setIsFullscreen(!isFullscreen),
                                                    title: isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600",
                                                    children: isFullscreen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-4 h-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M6 18L18 6M6 6l12 12",
                                                            className: "jsx-97cb4c3eb5ceaed4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 476,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 475,
                                                        columnNumber: 21
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-4 h-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
                                                            className: "jsx-97cb4c3eb5ceaed4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 480,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 479,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 469,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setIsOpen(false),
                                                    title: "Close JARVIS",
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-4 h-4",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M6 18L18 6M6 6l12 12",
                                                            className: "jsx-97cb4c3eb5ceaed4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 492,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 491,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 486,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 459,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 439,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "mt-3 text-xs text-blue-600 font-mono px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-200/30",
                                    children: "💬 Ask me anything about your studies • 🎯 Get personalized help • 📚 Create study materials"
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 499,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 438,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "px-5 py-3 border-b border-gray-200/50 bg-blue-50/30",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-2 flex-wrap",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs text-blue-600 font-mono font-semibold",
                                        children: "CONTEXT:"
                                    }, void 0, false, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 507,
                                        columnNumber: 15
                                    }, this),
                                    userContext.currentPage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200/50",
                                        children: [
                                            "📍 ",
                                            userContext.currentPage
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 509,
                                        columnNumber: 17
                                    }, this),
                                    context?.todayTasks && context.todayTasks.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200/50",
                                        children: [
                                            "✅ ",
                                            context.todayTasks.length,
                                            " tasks today"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 514,
                                        columnNumber: 17
                                    }, this),
                                    context?.courses && context.courses.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200/50",
                                        children: [
                                            "📚 ",
                                            context.courses.length,
                                            " courses"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 519,
                                        columnNumber: 17
                                    }, this),
                                    context?.habits && context.habits.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium border border-orange-200/50",
                                        children: [
                                            "🎯 ",
                                            context.habits.length,
                                            " habits"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 524,
                                        columnNumber: 17
                                    }, this),
                                    !userContext.currentPage && (!context?.todayTasks || context.todayTasks.length === 0) && (!context?.courses || context.courses.length === 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200/50",
                                        children: "🌟 Ready to help with your studies"
                                    }, void 0, false, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 529,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/jarvis-assistant.tsx",
                                lineNumber: 506,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 505,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + `flex-1 overflow-y-auto p-4 space-y-4 ${isFullscreen ? "max-h-none" : "max-h-80"}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute top-20 left-4 w-px h-8 bg-gradient-to-b from-blue-400/30 to-transparent"
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 539,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute top-20 right-4 w-px h-8 bg-gradient-to-b from-blue-400/30 to-transparent"
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 540,
                                    columnNumber: 13
                                }, this),
                                messages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "space-y-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "space-y-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold",
                                                            children: "📝 CREATE STUDY MATERIALS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 547,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex flex-wrap gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit(context?.courses?.length ? "Create flashcards for my courses" : "Create flashcards for today's topic"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-all hover:scale-105 border border-blue-200/50",
                                                                    children: "🃏 Flashcards"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 549,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit(context?.todayTasks?.length ? "Generate a quiz for my today's tasks" : "Generate a quiz for what I learned today"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-all hover:scale-105 border border-green-200/50",
                                                                    children: "❓ Quiz Me"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 555,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit("Create a study plan for this week"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-all hover:scale-105 border border-purple-200/50",
                                                                    children: "📅 Study Plan"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 561,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 548,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 546,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold",
                                                            children: "🎯 GET HELP & EXPLANATIONS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 571,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex flex-wrap gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit("Explain this concept simply"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-all hover:scale-105 border border-orange-200/50",
                                                                    children: "💡 Explain Concept"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 573,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit("Help me understand this problem"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-all hover:scale-105 border border-red-200/50",
                                                                    children: "🤔 Problem Help"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 579,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit("Give me study tips"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-200 transition-all hover:scale-105 border border-indigo-200/50",
                                                                    children: "💪 Study Tips"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 585,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 572,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 570,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold",
                                                            children: "⚡ QUICK ACTIONS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 595,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex flex-wrap gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit(context?.todayTasks?.length ? "Start a 25-minute focus session on my first task" : "Start a 25-minute focus session"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium hover:bg-emerald-200 transition-all hover:scale-105 border border-emerald-200/50",
                                                                    children: "⏱️ Focus Timer"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 597,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit("Review my progress this week"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium hover:bg-cyan-200 transition-all hover:scale-105 border border-cyan-200/50",
                                                                    children: "📊 Progress Review"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 603,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>handleSubmit("What's my study streak?"),
                                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-2 bg-pink-100 text-pink-700 rounded-full text-xs font-medium hover:bg-pink-200 transition-all hover:scale-105 border border-pink-200/50",
                                                                    children: "🔥 Study Streak"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 609,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 596,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 594,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 545,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "p-4 rounded-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200/30",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold",
                                                    children: "🚀 JARVIS CAPABILITIES"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 621,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "grid grid-cols-1 gap-3 text-xs text-gray-600",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__["BookOpen"], {
                                                                    className: "w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 624,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                                    children: "Generate flashcards, quizzes, and study plans from any topic"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 625,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 623,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                                                                    className: "w-3 h-3 text-green-500 mt-0.5 flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 628,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                                    children: "Provide personalized explanations and problem-solving help"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 629,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 627,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__["Lightbulb"], {
                                                                    className: "w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 632,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                                    children: "Track your progress and suggest optimal study strategies"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 633,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 631,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Navigation$3e$__["Navigation"], {
                                                                    className: "w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 636,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-97cb4c3eb5ceaed4",
                                                                    children: "Navigate the app and control study sessions with voice commands"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                                    lineNumber: 637,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 635,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 622,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 620,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 543,
                                    columnNumber: 15
                                }, this),
                                messages.map((msg)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + `max-w-[85%] ${msg.role === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-sm" : "bg-white/90 border border-gray-200/50 text-gray-800 rounded-2xl rounded-bl-md shadow-sm"} px-4 py-3 relative overflow-hidden`,
                                            children: [
                                                msg.role === "assistant" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 657,
                                                    columnNumber: 21
                                                }, this),
                                                msg.role === "assistant" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-2 mb-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-[10px] font-mono text-blue-600",
                                                            children: "JARVIS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 662,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-[10px] text-gray-500",
                                                            children: msg.timestamp.toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                                            lineNumber: 663,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 661,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "text-sm whitespace-pre-wrap leading-relaxed",
                                                    children: msg.content
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 669,
                                                    columnNumber: 19
                                                }, this),
                                                msg.action?.type === "show_flashcards" && msg.action.data?.flashcards && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "mt-3 pt-3 border-t border-gray-200/50",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs text-gray-600 font-mono",
                                                        children: [
                                                            msg.action.data.flashcards.length,
                                                            " FLASHCARDS GENERATED"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 673,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 672,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 649,
                                            columnNumber: 17
                                        }, this)
                                    }, msg.id, false, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 645,
                                        columnNumber: 15
                                    }, this)),
                                isProcessing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex justify-start",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "bg-white/90 border border-gray-200/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "text-[10px] font-mono text-blue-600",
                                                    children: "PROCESSING"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 686,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/jarvis-assistant.tsx",
                                                lineNumber: 685,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-1 mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            animationDelay: "0ms"
                                                        },
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 689,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            animationDelay: "150ms"
                                                        },
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 690,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            animationDelay: "300ms"
                                                        },
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 691,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/jarvis-assistant.tsx",
                                                lineNumber: 688,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 684,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 683,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    ref: messagesEndRef,
                                    className: "jsx-97cb4c3eb5ceaed4"
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 697,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 537,
                            columnNumber: 11
                        }, this),
                        isVoiceNotesMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "p-4 border-t border-gray-200/50 bg-gray-50/50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center justify-between mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-sm font-mono text-blue-600",
                                            children: "VOICE NOTES"
                                        }, void 0, false, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 704,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setVoiceNotes(""),
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200",
                                                    children: "CLEAR"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 706,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setIsVoiceNotesMode(false),
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300",
                                                    children: "EXIT"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 712,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 705,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 703,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "bg-white/80 border border-gray-200/50 rounded-lg p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap",
                                    children: voiceNotes || "Start speaking to add voice notes..."
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 720,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 702,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-97cb4c3eb5ceaed4" + " " + "relative p-4 border-t border-gray-200/50 bg-gray-50/80",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-2 mb-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__["Lightbulb"], {
                                                    className: "w-4 h-4 text-yellow-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 731,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs font-medium text-gray-600 uppercase tracking-wide",
                                                    children: "Suggested Commands"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 732,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 730,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex flex-wrap gap-2",
                                            children: (()=>{
                                                const commandParser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jarvis$2f$commandParser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCommandParser"])();
                                                const commandContext = {
                                                    userId: user?.uid || '',
                                                    currentPage: pathname,
                                                    availableData: {
                                                        tasks: context?.todayTasks,
                                                        courses: context?.courses,
                                                        habits: context?.habits
                                                    }
                                                };
                                                const suggestions = commandParser.getSuggestedCommands(commandContext);
                                                return suggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleSubmit(suggestion),
                                                        disabled: isProcessing,
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                                        children: suggestion
                                                    }, index, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 749,
                                                        columnNumber: 21
                                                    }, this));
                                            })()
                                        }, void 0, false, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 734,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 729,
                                    columnNumber: 13
                                }, this),
                                voiceState.isListening && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-white border border-gray-300 rounded-full flex items-center gap-2 shadow-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "w-3 h-3 bg-red-500 rounded-full animate-pulse"
                                        }, void 0, false, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 765,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "text-xs text-gray-700 font-mono",
                                            children: voiceState.interimTranscript || "LISTENING..."
                                        }, void 0, false, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 766,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 764,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                    onSubmit: (e)=>{
                                        e.preventDefault();
                                        handleSubmit();
                                    },
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center gap-3",
                                    children: [
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSpeechRecognitionSupported"])() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>{
                                                if (isVoiceNotesMode) {
                                                    setIsVoiceNotesMode(false);
                                                } else if (voiceState.isListening) {
                                                    stopListening();
                                                } else {
                                                    setIsVoiceNotesMode(true);
                                                    startListening();
                                                    setShowWaveform(true);
                                                }
                                            },
                                            title: isVoiceNotesMode ? "Exit Voice Notes Mode" : voiceState.isListening ? "Stop Listening" : "Start Voice Input",
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + `relative p-3 rounded-xl transition-all ${isVoiceNotesMode || voiceState.isListening ? "bg-red-100 text-red-600 border border-red-300" : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"}`,
                                            children: isVoiceNotesMode || voiceState.isListening ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                className: "jsx-97cb4c3eb5ceaed4" + " " + "w-5 h-5",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 000 2h6a1 1 0 000-2H9z",
                                                    className: "jsx-97cb4c3eb5ceaed4"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 803,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/jarvis-assistant.tsx",
                                                lineNumber: 802,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                className: "jsx-97cb4c3eb5ceaed4" + " " + "w-5 h-5",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
                                                    className: "jsx-97cb4c3eb5ceaed4"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 807,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/jarvis-assistant.tsx",
                                                lineNumber: 806,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 781,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "flex-1 relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    ref: inputRef,
                                                    type: "text",
                                                    value: inputValue,
                                                    onChange: (e)=>setInputValue(e.target.value),
                                                    placeholder: "Speak or type a command...",
                                                    disabled: isProcessing,
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 font-mono shadow-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 815,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 rounded-xl pointer-events-none overflow-hidden",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-97cb4c3eb5ceaed4" + " " + "absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 animate-shimmer"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                                        lineNumber: 825,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 824,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 814,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "submit",
                                            disabled: !inputValue.trim() || isProcessing,
                                            className: "jsx-97cb4c3eb5ceaed4" + " " + "p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                className: "jsx-97cb4c3eb5ceaed4" + " " + "w-5 h-5",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M13 7l5 5m0 0l-5 5m5-5H6",
                                                    className: "jsx-97cb4c3eb5ceaed4"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                                    lineNumber: 836,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/jarvis-assistant.tsx",
                                                lineNumber: 835,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/jarvis-assistant.tsx",
                                            lineNumber: 830,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 772,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-97cb4c3eb5ceaed4" + " " + "flex items-center justify-between mt-3 text-[10px] text-gray-500 font-mono",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-97cb4c3eb5ceaed4",
                                        children: [
                                            "POWERED BY AI • ",
                                            new Date().toLocaleDateString()
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/jarvis-assistant.tsx",
                                        lineNumber: 843,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/jarvis-assistant.tsx",
                                    lineNumber: 842,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/jarvis-assistant.tsx",
                            lineNumber: 727,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/jarvis-assistant.tsx",
                    lineNumber: 430,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/jarvis-assistant.tsx",
                lineNumber: 419,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                id: "97cb4c3eb5ceaed4",
                children: "@keyframes shimmer{0%{transform:translate(-100%)}to{transform:translate(100%)}}.animate-shimmer{animation:3s infinite shimmer}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true);
}
}),
"[project]/components/providers.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$error$2d$boundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/error-boundary.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth-provider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$theme$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/theme-provider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$loading$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/loading.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$jarvis$2d$assistant$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/jarvis-assistant.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$error$2d$boundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ErrorBoundary"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$theme$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeProvider"], {
            attribute: "class",
            defaultTheme: "dark",
            enableSystem: true,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2d$provider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthProvider"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$loading$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoadingProvider"], {
                    children: [
                        children,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$jarvis$2d$assistant$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["JarvisAssistant"], {}, void 0, false, {
                            fileName: "[project]/components/providers.tsx",
                            lineNumber: 17,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/providers.tsx",
                    lineNumber: 15,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/providers.tsx",
                lineNumber: 14,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/providers.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/providers.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/ui/toast.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toast",
    ()=>Toast,
    "ToastAction",
    ()=>ToastAction,
    "ToastClose",
    ()=>ToastClose,
    "ToastDescription",
    ()=>ToastDescription,
    "ToastProvider",
    ()=>ToastProvider,
    "ToastTitle",
    ()=>ToastTitle,
    "ToastViewport",
    ()=>ToastViewport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"].displayName;
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive border-destructive bg-destructive text-destructive-foreground",
            success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50",
            warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-50"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Toast = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, variant, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 64,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/components/ui/toast.tsx",
            lineNumber: 88,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 79,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 97,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm opacity-90", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/toast.tsx",
        lineNumber: 109,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"].displayName;
;
}),
"[project]/lib/hooks/useToast.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        listeners.push(setState);
        return ()=>{
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
;
}),
"[project]/components/ui/toaster.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/toast.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useToast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useToast.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function Toaster() {
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useToast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastProvider"], {
        children: [
            toasts.map(function({ id, title, description, action, ...props }) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Toast"], {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastTitle"], {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/toaster.tsx",
                                    lineNumber: 22,
                                    columnNumber: 25
                                }, this),
                                description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastDescription"], {
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/components/ui/toaster.tsx",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ui/toaster.tsx",
                            lineNumber: 21,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastClose"], {}, void 0, false, {
                            fileName: "[project]/components/ui/toaster.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/components/ui/toaster.tsx",
                    lineNumber: 20,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastViewport"], {}, void 0, false, {
                fileName: "[project]/components/ui/toaster.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/toaster.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__44855f30._.js.map