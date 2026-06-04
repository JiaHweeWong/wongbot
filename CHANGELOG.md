# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add a LangGraph chat flow with a summarizer node, a primary response node,
  and read-only tools for blog posts and skill documents.
- Stream chat text and tool activity to the frontend so tool calls are visible
  while Wongbot responds.

### Fixed
- Prevent structured chat stream chunks from rendering as `[object Object]`.
