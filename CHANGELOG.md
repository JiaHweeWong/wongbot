# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-06-04

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
