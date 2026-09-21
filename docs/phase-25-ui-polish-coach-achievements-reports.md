# Phase 25 — UI polish, step 5: Coach, Achievements, Reports

- Coach: messages slide up, animated typing dots, suggestion chips stagger and turn lime on hover, input glows on focus.
- Achievements / Reports: XP, badge-progress, goal-progress and time-distribution bars now grow from the left using
  `transform: scaleX` (new `animate-grow-x`) instead of transitioning `width`, so they are GPU-friendly.
- Unlocked badge icons pop in, badge grid staggers, dark hero cards get a deeper tinted shadow.
- Export/refresh buttons get press feedback.
