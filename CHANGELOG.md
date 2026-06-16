# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add clickable starter-question chips to the chat empty state so visitors have
  a clear first action.
- Add Fraunces display font for headings, nav brand, and blog post titles; keep
  Geist Sans for body and Geist Mono for dates and metadata.
- Add iMessage-style spring-pop entrance animations for chat bubbles (user
  bubbles slide in from the right, bot bubbles from the left).

### Changed
- Replace the blue accent colour with a warm amber palette throughout; add a
  warm radial gradient to the body background (fixed to the viewport).
- Redesign the nav to show the site name as a Fraunces brand mark on the left
  and the Blog link on the right.
- Anchor chat messages to the bottom of the viewport so they fill upward as the
  conversation grows, matching standard messaging-app behaviour.
- Make `<main>` the scroll container so the nav bar remains fixed at the top
  while blog post content scrolls independently.
- Remove the hard border separator above the message input for a softer
  transition between the chat area and the input bar.

### Fixed
- Fix the warm gradient creating a visible travelling line when scrolling by
  setting `background-attachment: fixed`.
- Hide the scrollbar inside the textarea, which was covering usable input space.

### Changed
- Restore the Vercel-native TypeScript LangGraph agent.
- Keep the latest 10 messages verbatim and summarize aged-out context in
  five-message batches.
- Cap primary responses at 700 tokens and summaries at 300 tokens.

### Fixed
- Remove the dependency on a separately deployed Python backend.

## [0.1.0] - 2026-06-04

### Added
- Add a LangGraph chat flow with a summarizer node, a primary response node,
  and read-only tools for blog posts and skill documents.
- Stream chat text and tool activity to the frontend so tool calls are visible
  while Wongbot responds.
- Add blog posts about building the personal website, critical reflection,
  and AI evaluation gaps.
- Add Vercel Web Analytics.
- Add Vercel Speed Insights.

### Changed
- Order blog posts by frontmatter date so newer posts appear first.
- Make Wongbot's system prompt use Singlish more sparingly.
- Default Wongbot to Gemini 3 Flash Preview.
- Preserve Wongbot conversations during in-app navigation while clearing them
  on page refresh.

### Fixed
- Prevent structured chat stream chunks from rendering as `[object Object]`.
- Prevent empty assistant placeholders from rendering as blank chat bubbles.
- Reduce LangGraph recursion limit failures by allowing longer tool loops and
  discouraging repeated tool calls.
- Render markdown formatting in Wongbot responses.
