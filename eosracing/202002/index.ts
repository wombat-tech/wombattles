declare const m: Mithril.Static

const root = document.body

const query = m.parseQueryString(document.location.search)
const prizePool: number = query.pool ? parseInt(query.pool as string) : 50.0

namespace Api {
  export type LeaderboardEntry = {
    selected_for: string
    total_score: number | null
    first_race: number
    first_tx: string
    second_race: number | null
    second_tx: string | null
    third_race: number | null
    third_tx: string | null
  }
}

/**
 * Loads the leaderboard data from the reporting API
 */
function loadData(): Promise<Api.LeaderboardEntry[]> {
  return m.request({
    method: 'GET',
    url: 'https://reporting.getwombat.io/challenges/eosrace-202002'
  })
}

/**
 * Pads a given number by with the given length and leading zeroes.
 * @param n
 * @param z
 */
function pad(n: number, z = 2): string {
  return ('00' + n).slice(-z)
}

/**
 * Converts a time in millisecond to a human readable format
 * @param s
 */
function msToTime(s: number): string {
  const ms = s % 1000
  s = (s - ms) / 1000
  const secs = s % 60
  s = (s - secs) / 60
  const mins = s % 60

  return mins + '\'' + pad(secs) + '.' + pad(ms, 3)
}

type LeaderboardEntry = Api.LeaderboardEntry & {
  isWinning: boolean
  percentageOfPrize: number
}

type LeaderBoardAttributes = {
  /**
   * The total amount of EOS that is split between the winners
   */
  prizePool: number
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
  const paidSlots = 30

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
          // Filter out entries that don't qualify for winning yet, i.e. the total score is not set yet (no three races)
          .filter(function (entry) {
            return entry.total_score !== null
          })
          // Mark the rest as winners and calculate share
          .forEach(function (entry, index) {
            entry.isWinning = true
            entry.percentageOfPrize = weight(index + 1)
          })

        leaderboardData = leaderboard as LeaderboardEntry[]
      })
  }

  /**
   * Calculates the percentage a given rank is winning of the prize pool
   * @param rank The 1-based rank to get the percentage for
   */
  function weight(rank: number) {
    switch (true) {
      case (rank == 1):
        return 0.2
      case (rank == 2):
        return 0.16
      case (rank == 3):
        return 0.12
      case (rank < 8):
        return 0.06
      case (rank < 13):
        return 0.04
      case (rank < 18):
        return 0.02
      case (rank < 23):
        return 0.01
      case (rank < 31):
        return 0.005
      default:
        return 0
    }
  }

  let mql: MediaQueryList | undefined

  /**
   * Flag if the narrow version of the table should be displayed.
   */
  let narrow: boolean = false

  function setNarrow(e: MediaQueryListEvent) {
    narrow = e.matches
    m.redraw()
  }

  return {
    oninit: function () {
      refresh()
      setInterval(refresh, 5000)
    },
    oncreate() {
      mql = window.matchMedia('(max-width: 650px)')
      if (mql.matches) {
        narrow = true
      }
      mql.addListener(setNarrow)
    },
    onremove() {
      if (mql) {
        mql.removeListener(setNarrow)
      }
    },
    view: function (vnode) {
      let table: Mithril.Vnode<any>
      if (narrow) {
        table = m(Tables.NarrowTable, { leaderboardData: leaderboardData, prizePool: vnode.attrs.prizePool })
      } else {
        table = m(Tables.WideTable, { leaderboardData: leaderboardData, prizePool: vnode.attrs.prizePool })
      }

      return m('#leaderboard', table)
    }
  }
}

namespace Tables {
  type TableAttributes = {
    leaderboardData: LeaderboardEntry[] | undefined
    prizePool: number
  }

  /**
   * The wide leaderboard table, displaying all 3 race times for each user that is in it.
   */
  export const WideTable: Mithril.Component<TableAttributes> = {
    view(vnode) {
      let entries: Mithril.Vnode<any>[]
      if (vnode.attrs.leaderboardData) {
        entries = vnode.attrs.leaderboardData.map(function (entry, index) {
          return m(WideDataRow, { entry: entry, index: index, prizePool: vnode.attrs.prizePool })
        })
      } else {
        entries = [m('tr', m('td', { colspan: 7 }, 'Please wait, loading data...'))]
      }
      return m('table.table.table-light.table-hover', [
        m('thead', m(WideHeaderRow)),
        m('tbody', entries)
      ])
    }
  }

  const WideDataRow: Mithril.Component<{ entry: LeaderboardEntry, index: number, prizePool: number }> = {
    view(vnode) {
      const { entry, index, prizePool } = vnode.attrs
      return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
        m('td', index + 1),
        m('td.account', entry.selected_for),
        m('td', m(TimeWithTx, { time: entry.first_race, txId: entry.first_tx })),
        m('td', m(TimeWithTx, { time: entry.second_race, txId: entry.second_tx })),
        m('td', m(TimeWithTx, { time: entry.third_race, txId: entry.third_tx })),
        m('td', entry.total_score ? msToTime(entry.total_score) : ''),
        m('td', entry.percentageOfPrize ? (entry.percentageOfPrize * prizePool).toFixed(4) : undefined)
      ])
    }
  }

  const WideHeaderRow: Mithril.Component = {
    view() {
      return m('tr', [
        m('th', '#'),
        m('th', 'Racer'),
        m('th', 'Fastest Race #1'),
        m('th', 'Fastest Race #2'),
        m('th', 'Fastest Race #3'),
        m('th', 'Total time'),
        m('th', 'Current EOS share')
      ])
    }
  }

  /**
   * The narrow leaderboard table, displaying only the rank, name, total time and EOS share for each user in it.
   */
  export const NarrowTable: Mithril.Component<TableAttributes> = {
    view(vnode) {
      let entries: Mithril.Vnode<any>[]
      if (vnode.attrs.leaderboardData) {
        entries = vnode.attrs.leaderboardData.map(function (entry, index) {
          return m(NarrowDataRow, { entry: entry, index: index, prizePool: vnode.attrs.prizePool })
        })
      } else {
        entries = [m('tr', m('td', { colspan: 4 }, 'Please wait, loading data...'))]
      }
      return m('table.table.table-light.table-hover.table-sm', [
        m('thead', m(NarrowHeaderRow)),
        m('tbody', entries)
      ])
    }
  }

  const NarrowHeaderRow: Mithril.Component = {
    view(vnode) {
      return m('tr', [
        m('th', '#'),
        m('th', 'Racer'),
        m('th', 'Total time'),
        m('th', 'EOS share')
      ])
    }
  }

  const NarrowDataRow: Mithril.Component<{ entry: LeaderboardEntry, index: number, prizePool: number }> = {
    view(vnode) {
      const { entry, index, prizePool } = vnode.attrs
      return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
        m('td', index + 1),
        m('td.account', entry.selected_for),
        m('td', entry.total_score ? msToTime(entry.total_score) : ''),
        m('td', entry.percentageOfPrize ? (entry.percentageOfPrize * prizePool).toFixed(4) : undefined)
      ])
    }
  }
}

type TimeWithTxAttributes = {
  /**
   * The time of the race in milliseconds. `null` if not present, '-' will be displayed then.
   */
  time: number | null
  /**
   * The transaction id in hex for the race.
   */
  txId: string | null
}
/**
 * Displays a race time with a link to the transaction for that race
 */
const TimeWithTx: Mithril.Component<TimeWithTxAttributes> = {
  view(vnode) {
    if (vnode.attrs.time !== null) {
      return m('a', {
        target: '_blank',
        href: `https://bloks.io/transaction/${vnode.attrs.txId}`
      }, msToTime(vnode.attrs.time))
    } else {
      return '-'
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
 * The start time of the Wombattle - 2020-02-03 10:00:00 UTC
 */
const START_TIME = 1580724000000
// const START_TIME = new Date().getTime() + 5_000
/**
 * The end time of the Wombattle - 2020-02-07 10:00:00 UTC
 */
const END_TIME = 1581069600000
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
            `Challenge starts in ${current.days} days, ${current.hours} hours, ${current.minutes} minutes and ${current.seconds} seconds 🏎️🏎️🏎️`
          )
        }
      } else if (finished) {
        return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' },
          m('strong', '🏎️🏎️🏎️The challenge has ended.')
        )
      } else if (current) {
        return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' }, [
            m('strong', '🏎️🏎️🏎️ Join now! '),
            `Challenge ends in ${current.days} days, ${current.hours} hours, ${current.minutes} minutes and ${current.seconds} seconds 🏎️🏎️🏎️`
          ]
        )
      }
    }
  }
}

/**
 * Component containing the leaderboard, the top section explaining the Wombattle, a countdown to the Wombattle and
 * the Wombat footer.
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
      return [
        m('section.top', [
          m('img#dapp-logo', { src: 'https://www.eosracing.io/eosracing/images/logo.png' }),
          m('p#subtitle', "The EOS Racing Wombattle will run from February, 3rd 10 am UTC until Februray, 7th 10 am UTC"),
          m('#pool.alert.alert-info', { role: 'alert' }, `Prize Pool: ${prizePool} EOS`),
          m('.rule', 'Get your free EOS account from ', [
            m('a', { href: 'https://getwombat.io?ref=wombattle-eos-racing' }, 'Wombat')
          ]),
          m('.rule', 'Finish at least 3 races or competitions'),
          m('.rule', 'Be the fastest racer on the street'),
          m(Countdown)
        ]),
        m(Leaderboard, { refresh: refresh, prizePool: prizePool }),
        m('#footer.alert.alert-light', { role: 'alert' }, [
          m('a', { href: 'https://getwombat.io' }, [
            m('img#wombattle-logo', { src: 'https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png' })
          ]),
          m('div#updated', `Last Updated: ${lastUpdated}`)
        ]),
      ]
    }
  }
}

const Layout: Mithril.Component = {
  view(vnode) {
    return m('main', [
      m(StoreBadges),
      m('section.content', vnode.children),
      m('aside.empty')
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

const Page = {
  view() {
    return m(Layout, m(LeaderboardContainer))
  }
}

// @ts-ignore
if (!window.m || !window.countdown) {
  root.innerText = 'Mithril could not be loaded. Please check if you are blocking Javascript from certain sources.'
} else {
  m.mount(root, Page)
}
