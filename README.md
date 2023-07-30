# YT Playlist manager [![CircleCI](https://circleci.com/gh/adikus/yt_playlist_dl.svg?style=svg)](https://circleci.com/gh/adikus/yt_playlist_dl)

## Migrations
Migrations are run using grunt:
```bash
grunt migrate:up
```
Migration files are in `data/migrations`.

## TODO

* [ ] Add a per-user queue model, records in the queue can be implicit or explicit
* [x] Fix video status being set to removed (or stop setting the status at all)
* [x] Figure out why remember tokens do not work
* [x] Redesign UI
  * [x] Main playlist view should be split into 3 (or more?) panes - Queue | Playlist | Video
  * [x] Also redesign other views - organize content so that it looks more polished
  * [ ] Make the new view mobile compatible - make the sidebar slide in / out
* [ ] Make search user content wide instead of playlist wide - redesign accordingly
* [ ] Add auto-constructing playlists 
  * [ ] Define YouTube channels from which they should pull - build UI for this
  * [ ] Add quick actions to videos in a auto-constructing playlist - move to other playlist
* [ ] Explore building this into an Elector app
  * Figure out if system-wide keyboard shortcuts would work (playlist sorting, rating)
