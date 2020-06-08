type LeaderboardData = {
  account: string
  duration: number
}

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
      <strong>⛏️⛏️⛏ Join now</strong> Challenge ends in {toEnd.days} days, {toEnd.hours} hours, {toEnd.minutes} minutes and {toEnd.seconds} seconds
    </div>
  } else {
    return <div id="countdown" className="alert alert-warning">
      <strong>⛏️⛏️⛏ The challenge has ended</strong>
    </div>
  }
}

const LeaderBoard: React.FunctionComponent<{ data: LeaderboardData[] }> = props => {

  return <div id="leaderboard">
    <table className="table table-light table-hover">
      <thead>
      <tr>
        <th>#</th>
        <th>Account</th>
        <th>Time mined</th>
        <th>Share</th>
      </tr>
      </thead>
      <tbody>
      {props.data.map((entry, i) => {
        const winning = i < 50
        return (
          <tr className={winning ? 'table-success' : ''}>
            <td>{i + 1}</td>
            <td>{entry.account}</td>
            <td>{entry.duration}</td>
            <td>{winning ? '2 EOS' : ''}</td>
          </tr>
        )
      })}
      </tbody>
    </table>
  </div>
}

const LeaderboardContainer = () => {
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date())
  const [leaderboardData, setLeaderBoardData] = React.useState<LeaderboardData[]>([])

  React.useEffect(() => {
    fetch('https://dashboard.getwombat.io/api/wombattles/prospectors-202006-birthday')
      .then(res => res.json())
      .then(data => setLeaderBoardData(data))
    setTimeout(() => setLastUpdated(new Date()), 60_000)
  }, [lastUpdated])

  return <main>
    <Badges/>
    <section className="content">
      <section className="top">
        <img id="dapp-logo"
             src="https://prospectors.io/assets/logo_with_icon-93f1a77ffc0259d6c4d44ef56b4020e8a20d7b8576cbc39917ba71c9d15b8606.png"/>
        <p id="wombattle-description">
          No gift like handmade — mine hard for a Wombat birthday present and get one, too!
          The longer you mine, the bigger is your chance to win 😉
        </p>
        <div id="pool" className="alert alert-info" role="alert">
          Prize Pool: 100 EOS
        </div>
        <Countdown start={1591711200000} end={1591884000000} />
      </section>
      <LeaderBoard data={leaderboardData}/>
      <footer className="alert alert-light" role="alert">
        <a href="https://getwombat.io">
          <img id="wombattle-logo"
               src="https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png"
               alt=""/>
        </a>
        <div id="updated">Last updated {lastUpdated.toString()}</div>
      </footer>
    </section>
    <aside className="empty"/>
  </main>
}

ReactDOM.render(<LeaderboardContainer/>, document.body)
