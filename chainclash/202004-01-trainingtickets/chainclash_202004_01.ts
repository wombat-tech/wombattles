declare const m: Mithril.Static

const root = document.body

namespace Api {
  export type LeaderboardEntry = {
    account: string
    usedTokens: number
  }
}

/**
 * Loads the leaderboard data from the reporting API
 */
function loadData(): Promise<Api.LeaderboardEntry[]> {
  return m.request({
    method: 'GET',
    url: 'https://reporting.getwombat.io/challenges/chainclash-202004-01'
  })
}

type LeaderboardEntry = Api.LeaderboardEntry & {
  isWinning: boolean
  prize: number
}

type LeaderBoardAttributes = {
  /**
   * A function to call to refresh the leaderboard data, returning it
   */
  refresh: () => Promise<Api.LeaderboardEntry[]>
}

/**
 * Leaderboard table component. Switches to a narrower table when the viewport is too small.
 */
const Leaderboard: Mithril.ClosureComponent<LeaderBoardAttributes> = function (intialVnode) {

  /**
   * The number of users who are counted as winners
   */
  const paidSlots = 10
  const prizeEos = 5
  let interval: number

  let leaderboardData: LeaderboardEntry[]

  /**
   * Refresh and enrich the leaderboard data (i.e. mark the winners and calculate how much EOS they are winning)
   */
  function refresh() {
    intialVnode.attrs.refresh()
      .then((leaderboard) => {
        (leaderboard as LeaderboardEntry[])
          // Only the first 50 entries win
          .slice(0, paidSlots)
          .forEach(function (entry, index) {
            entry.isWinning = true
            if (index < 10) {
              entry.prize = prizeEos
            }
          })

        leaderboardData = leaderboard as LeaderboardEntry[]
      })
  }

  return {
    oninit: function () {
      refresh()
      interval = setInterval(refresh, 60_000)
    },
    onremove() {
      if (interval) {
        clearInterval(interval)
      }
    },
    view: function () {
      return m('#leaderboard', m(Tables.Table, { leaderboardData: leaderboardData }))
    }
  }
}

namespace Tables {
  type TableAttributes = {
    leaderboardData: LeaderboardEntry[] | undefined
  }

  /**
   * The wide leaderboard table, displaying all 3 race times for each user that is in it.
   */
  export const Table: Mithril.Component<TableAttributes> = {
    view(vnode) {
      let entries: Mithril.Vnode<any>[]
      if (vnode.attrs.leaderboardData) {
        entries = vnode.attrs.leaderboardData.map(function (entry, index) {
          return m(DataRow, { entry: entry, index: index })
        })
      } else {
        entries = [m('tr', m('td', { colspan: 4 }, 'Please wait, loading data...'))]
      }
      return m('table.table.table-light.table-hover', [
        m('thead', m(HeaderRow)),
        m('tbody', entries)
      ])
    }
  }

  const DataRow: Mithril.Component<{ entry: LeaderboardEntry, index: number }> = {
    view(vnode) {
      const { entry, index } = vnode.attrs
      return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
        m('td', index + 1),
        m('td.account', entry.account),
        m('td', entry.usedTokens),
        m('td', entry.prize ? entry.prize.toFixed(4) : undefined)
      ])
    }
  }

  const HeaderRow: Mithril.Component = {
    view() {
      return m('tr', [
        m('th', '#'),
        m('th', 'Player'),
        m('th', 'Used training tickets'),
        m('th', 'Prize')
      ])
    }
  }
}

// Countdown library
declare const countdown: any

/**
 * Timestamp as reported by {@link countdown}
 */
type TS = {
  days: number
  end: Date
  hours: number
  minutes: number
  seconds: number
  start: Date
  units: number
  value: number
}

/**
 * The start time of the Wombattle - 2020-04-20 14:00:00 UTC
 */
const START_TIME = 1587391200000
/**
 * The end time of the Wombattle - 2020-04-24 14:00:00 UTC
 */
const END_TIME = 1587736800000
// const END_TIME = START_TIME + 9_000

const Countdown: Mithril.ClosureComponent = function () {
  let timerId: number | undefined
  let current: TS | undefined
  let finished = new Date().getTime() >= END_TIME
  let started = new Date().getTime() >= START_TIME

  /**
   * Create a timer with {@link countdown} that goes towards `time`. The value {@link current} will be updated in each
   * step (once per second).
   * Once `time` is in the past, `onEnd` will be called.
   * @param time The time to count to, should be in the future
   * @param onEnd A callback to call once `time` is in the past. Will stop the timer as well.
   */
  function c(time: number, onEnd: () => void) {
    timerId = countdown(
      function (ts: TS) {
        current = ts
        if (ts.value <= 0) {
          onEnd()
          clearTimeout(timerId)
        }
        m.redraw()
      },
      time,
      countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS)
  }

  function startCountdownToEnd() {
    c(END_TIME, () => {
      finished = true
    })
  }

  function startCountdownToStart() {
    c(START_TIME, () => {
      started = true
      startCountdownToEnd()
    })
  }

  return {
    oninit() {
      if (!started) {
        startCountdownToStart()
      } else if (!finished) {
        startCountdownToEnd()
      }
    },
    onremove() {
      clearTimeout(timerId)
    },
    view() {
      if (!started) {
        if (current) {
          return m('div', { id: 'countdown', class: 'alert alert-info', role: 'alert' },
            `Challenge starts in ${current.days} days, ${current.hours} hours, ${current.minutes} minutes and ${current.seconds} seconds`
          )
        }
      } else if (finished) {
        return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' },
          m('strong', '️The challenge has ended.')
        )
      } else if (current) {
        return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' }, [
            m('strong', 'Join now!'),
            `Challenge ends in ${current.days} days, ${current.hours} hours, ${current.minutes} minutes and ${current.seconds} seconds`
          ]
        )
      }
    }
  }
}

/**
 * Component containing the leaderboard, the top section explaining the Wombattle, a countdown to
 * the Wombattle and the Wombat footer.
 */
const LeaderboardContainer: Mithril.ClosureComponent = function () {
  let lastUpdated: Date | undefined

  /**
   * Loads the leaderboard data, marks the winners and their share of the price pool
   */
  function refresh() {
    return loadData()
      .then((leaderboard) => {
        lastUpdated = new Date()
        return leaderboard
      })
  }

  return {
    view: function () {
      return m('section.leaderboard', [
        m(Leaderboard, { refresh: refresh }),
        m(Countdown),
        m('#footer.alert.alert-light', { role: 'alert' }, [
          m('a', { href: 'https://getwombat.io' }, [
            m('img#wombattle-logo', { src: 'https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png' })
          ]),
          m('div#updated', `Last Updated: ${lastUpdated}`)
        ])
      ])
    }
  }
}

const Description: Mithril.Component = {
  view() {
    return [
      // m('.rule', 'Step 1: Get your free EOS account from ', [
      //   m('a', { href: 'https://getwombat.io?ref=wombattle-eos-racing' }, 'Wombat')
      // ]),
      m('.prize-pool.alert.alert-warning', '50 EOS PRIZE POOL'),
      m(StoreBadges)
    ]
  }
}

const Layout: Mithril.Component = {
  view() {
    return m('main', [
      // m(StoreBadges),
      m('.dapp-logo', m('img', { src: 'https://wombattles.getwombat.io/leaderboard/assets/chainclash-logo.png' })),
      m('h1.leaderboard-heading', 'Leaderboard'),
      m(LeaderboardContainer),
      m(Description)
    ])
  }
}

/**
 * An `<aside>` containing badges for all stores, linking to them.
 */
const StoreBadges: Mithril.Component = {
  view() {
    return m('aside.store-badges', [
      m('a.badge', { href: 'https://play.google.com/store/apps/details?id=io.getwombat.android&referrer=utm_source%3Dwombattle_prospectors%26utm_medium%3Dbadge' }, [
        m('img#badge-google-play', { src: 'https://wombattles.getwombat.io/leaderboard/assets/badge-google-play.png' })
      ]),
      m('a.badge', { href: 'https://apps.apple.com/app/wombat-wallet/id1474392110' }, [
        m('img#badge-app-store', { src: 'https://wombattles.getwombat.io/leaderboard/assets/badge-app-store.png' })
      ]),
      m('a.badge', { href: 'https://chrome.google.com/webstore/detail/wombat-eos-wallet/amkmjjmmflddogmhpjloimipbofnfjih' }, [
        m('img#badge-chrome-store', { src: 'https://wombattles.getwombat.io/leaderboard/assets/badge-chrome-store.png' })
      ])
    ])
  }
}

// @ts-ignore
if (!window.m || !window.countdown) {
  root.innerText = 'Mithril could not be loaded. Please check if you are blocking Javascript from certain sources.'
} else {
  m.mount(root, Layout)
}
