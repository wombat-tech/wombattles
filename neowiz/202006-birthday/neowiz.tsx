// Coming from the html file
declare const GAME: string
declare const LEADERBOARD_URL: string
declare const DAPP_LOGO_URL: string

type LeaderboardData = {
  winner: string
  channel: number
  count: number
}

type Channel = 'Wood' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond'

const Channels: Channel[] = ['Wood', 'Bronze', 'Silver', 'Gold', 'Diamond']
// const ChannelEmojis = ['\U+1F333', '\U+1F949', '\U+1F948', '\U+1F948', '\U+1F48E']
const ChannelEmojis = ['🌳', '🥉', '🥈', '🥇', '💎']

const Badges: React.FunctionComponent = () => (
  <aside className="store-badges">
    <a className="badge"
       href="https://play.google.com/store/apps/details?id=io.getwombat.android&referrer=utm_source%3Dwombattle_prospectors_202006%26utm_medium%3Dbadge">
      <img src="https://wombattles.getwombat.io/leaderboard/assets/badge-google-play.png"/>
    </a>
    <a className="badge" href="https://apps.apple.com/app/wombat-wallet/id1474392110">
      <img src="https://wombattles.getwombat.io/leaderboard/assets/badge-app-store.png"/>
    </a>
    <a className="badge"
       href="https://chrome.google.com/webstore/detail/wombat-eos-wallet/amkmjjmmflddogmhpjloimipbofnfjih">
      <img src="https://wombattles.getwombat.io/leaderboard/assets/badge-chrome-store.png"/>
    </a>
  </aside>
)

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
const Countdown: React.FunctionComponent<{ start: number, end: number }> = props => {
  const toStart: TS = countdown(null, props.start, countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS)
  const toEnd: TS = countdown(null, props.end, countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS)
  const [, setIndex] = React.useState<number>(0)
  const interval = React.useRef<number | undefined>()

  React.useEffect(() => {
    interval.current = setInterval(() => {
      setIndex(prev => prev + 1)
    }, 1000)
    return function cleanup() {
      if (interval.current) {
        clearInterval(interval.current)
      }
    }
  }, [])

  if (toStart.value > 0) {
    return <div id="countdown" className="alert alert-info" role="alert">
      Challenge starts in {toStart.days} days, {toStart.hours} hours, {toStart.minutes} minutes
      and {toStart.seconds} seconds
    </div>
  } else if (toEnd.value > 0) {
    return <div id="countdown" className="alert alert-warning" role="alert">
      <strong>⛏️⛏️⛏ Join now</strong> Challenge ends
      in {toEnd.days} days, {toEnd.hours} hours, {toEnd.minutes} minutes and {toEnd.seconds} seconds
    </div>
  } else {
    return <div id="countdown" className="alert alert-warning">
      <strong>⛏️⛏️⛏ The challenge has ended</strong>
    </div>
  }
}

type LeaderboardEntry = {
  winner: string
  gamesWon: number
  share: number | null
}

const LeaderBoard: React.FunctionComponent<{ channelIndex: number, data: LeaderboardEntry[] }> = props => {

  return <article>
    <h2 className="h2 leaderboard-channel">{ChannelEmojis[props.channelIndex]} {Channels[props.channelIndex]}</h2>
    <div className="leaderboard">
      <table className="table table-light table-hover">
        <thead>
        <tr>
          <th>#</th>
          <th>Account</th>
          <th>Games won</th>
          <th>Share</th>
        </tr>
        </thead>
        <tbody>
        {props.data.map((entry, i) => {
          const winning = entry.share !== null
          return (
            <tr className={winning ? 'table-success' : ''}>
              <td>{i + 1}</td>
              <td>{entry.winner}</td>
              <td>{entry.gamesWon}</td>
              <td>{winning ? `${entry.share!.toFixed(2)} EOS` : ''}</td>
            </tr>
          )
        })}
        </tbody>
      </table>
    </div>
  </article>
}

const PAYOUT = [
  [1.2, 0.8, 0.5, 0.3, 0.2], // wood - id 0
  [2.4, 1.6, 1, 0.6, 0.4], // bronze - id 1
  [4, 2.5, 2, 1, 0.5], // silver - id 2
  [5, 4, 2.5, 1.5, 1], // gold - id 3
  [6, 5, 3, 2, 1] // diamond - id 4
]

function apiDataToEntry(data: LeaderboardData, rank: number, channelId: number): LeaderboardEntry {
  if (rank < 5) {
    return {
      winner: data.winner,
      gamesWon: data.count,
      share: PAYOUT[channelId][rank]
    }
  } else {
    return {
      winner: data.winner,
      gamesWon: data.count,
      share: null
    }
  }
}

const LeaderboardContainer = () => {
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date())
  const [leaderboardData, setLeaderBoardData] = React.useState<LeaderboardData[]>([])

  React.useEffect(() => {
    fetch(LEADERBOARD_URL)
      .then(res => res.json())
      .then(data => setLeaderBoardData(data))
    setTimeout(() => setLastUpdated(new Date()), 60_000)
  }, [lastUpdated])

  return <main className="container-fluid">
    <div className="row">
      <div className="col-lg-2 order-2 order-lg-0 align-self-center">
        <Badges/>
      </div>
      <section className="content col-lg-9 col-12 order-sm-0 order-lg-1">
        <section className="top">
          <img id="dapp-logo"
               src={DAPP_LOGO_URL}/>
          <p id="wombattle-description">
            {GAME}
          </p>
          <div id="pool" className="alert alert-info" role="alert">
            Prize pool: 50 EOS
          </div>
          <Countdown start={1591970400000} end={1592226000000}/>
        </section>
        <div className="row">
          {Channels.map((channel, id) => (
            <div className={`col-lg-6 col-xl-4 col-md-12 order-${4 - id}`}>
              <LeaderBoard channelIndex={id} data={
                leaderboardData
                  .filter(data => data.channel === id)
                  .map((data, rank) => apiDataToEntry(data, rank, id))
              }/>
            </div>
          ))}
        </div>
        <footer className="alert alert-light" role="alert">
          <a href="https://getwombat.io">
            <img id="wombattle-logo"
                 src="https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png"
                 alt=""/>
          </a>
          <div id="updated">Last updated {lastUpdated.toString()}</div>
        </footer>
      </section>
      <aside className="col-lg-1 order-2"/>
    </div>
  </main>
}

ReactDOM.render(<LeaderboardContainer/>, document.body)
