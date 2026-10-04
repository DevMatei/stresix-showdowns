import * as migration_20260918_151037_initial from './20260918_151037_initial'
import * as migration_20261004_160000_posts from './20261004_160000_posts'

export const migrations = [
  {
    up: migration_20260918_151037_initial.up,
    down: migration_20260918_151037_initial.down,
    name: '20260918_151037_initial',
  },
  {
    up: migration_20261004_160000_posts.up,
    down: migration_20261004_160000_posts.down,
    name: '20261004_160000_posts',
  },
]
