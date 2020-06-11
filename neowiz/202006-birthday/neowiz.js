"use strict";
var Channels = ['Wood', 'Bronze', 'Silver', 'Gold', 'Diamond'];
var ChannelEmojis = ['🌳', '🥉', '🥈', '🥇', '💎'];
var Badges = function () { return (React.createElement("aside", { className: "store-badges" },
    React.createElement("a", { className: "badge", href: "https://play.google.com/store/apps/details?id=io.getwombat.android&referrer=utm_source%3Dwombattle_prospectors_202006%26utm_medium%3Dbadge" },
        React.createElement("img", { src: "https://wombattles.getwombat.io/leaderboard/assets/badge-google-play.png" })),
    React.createElement("a", { className: "badge", href: "https://apps.apple.com/app/wombat-wallet/id1474392110" },
        React.createElement("img", { src: "https://wombattles.getwombat.io/leaderboard/assets/badge-app-store.png" })),
    React.createElement("a", { className: "badge", href: "https://chrome.google.com/webstore/detail/wombat-eos-wallet/amkmjjmmflddogmhpjloimipbofnfjih" },
        React.createElement("img", { src: "https://wombattles.getwombat.io/leaderboard/assets/badge-chrome-store.png" })))); };
var Countdown = function (props) {
    var toStart = countdown(null, props.start, countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS);
    var toEnd = countdown(null, props.end, countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS);
    var _a = React.useState(0), setIndex = _a[1];
    var interval = React.useRef();
    React.useEffect(function () {
        interval.current = setInterval(function () {
            setIndex(function (prev) { return prev + 1; });
        }, 1000);
        return function cleanup() {
            if (interval.current) {
                clearInterval(interval.current);
            }
        };
    }, []);
    if (toStart.value > 0) {
        return React.createElement("div", { id: "countdown", className: "alert alert-info", role: "alert" },
            "Challenge starts in ",
            toStart.days,
            " days, ",
            toStart.hours,
            " hours, ",
            toStart.minutes,
            " minutes and ",
            toStart.seconds,
            " seconds");
    }
    else if (toEnd.value > 0) {
        return React.createElement("div", { id: "countdown", className: "alert alert-warning", role: "alert" },
            React.createElement("strong", null, "\u26CF\uFE0F\u26CF\uFE0F\u26CF Join now"),
            " Challenge ends in ",
            toEnd.days,
            " days, ",
            toEnd.hours,
            " hours, ",
            toEnd.minutes,
            " minutes and ",
            toEnd.seconds,
            " seconds");
    }
    else {
        return React.createElement("div", { id: "countdown", className: "alert alert-warning" },
            React.createElement("strong", null, "\u26CF\uFE0F\u26CF\uFE0F\u26CF The challenge has ended"));
    }
};
var LeaderBoard = function (props) {
    return React.createElement("article", null,
        React.createElement("h2", { className: "h2 leaderboard-channel" },
            ChannelEmojis[props.channelIndex],
            " ",
            Channels[props.channelIndex]),
        React.createElement("div", { className: "leaderboard" },
            React.createElement("table", { className: "table table-light table-hover" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", null, "#"),
                        React.createElement("th", null, "Account"),
                        React.createElement("th", null, "Games won"),
                        React.createElement("th", null, "Share"))),
                React.createElement("tbody", null, props.data.map(function (entry, i) {
                    var winning = entry.share !== null;
                    return (React.createElement("tr", { className: winning ? 'table-success' : '' },
                        React.createElement("td", null, i + 1),
                        React.createElement("td", null, entry.winner),
                        React.createElement("td", null, entry.gamesWon),
                        React.createElement("td", null, winning ? entry.share.toFixed(2) + " EOS" : '')));
                })))));
};
var PAYOUT = [
    [1.2, 0.8, 0.5, 0.3, 0.2],
    [2.4, 1.6, 1, 0.6, 0.4],
    [4, 2.5, 2, 1, 0.5],
    [5, 4, 2.5, 1.5, 1],
    [6, 5, 3, 2, 1]
];
function apiDataToEntry(data, rank, channelId) {
    if (rank < 5) {
        return {
            winner: data.winner,
            gamesWon: data.count,
            share: PAYOUT[channelId][rank]
        };
    }
    else {
        return {
            winner: data.winner,
            gamesWon: data.count,
            share: null
        };
    }
}
var LeaderboardContainer = function () {
    var _a = React.useState(new Date()), lastUpdated = _a[0], setLastUpdated = _a[1];
    var _b = React.useState([]), leaderboardData = _b[0], setLeaderBoardData = _b[1];
    React.useEffect(function () {
        fetch(LEADERBOARD_URL)
            .then(function (res) { return res.json(); })
            .then(function (data) { return setLeaderBoardData(data); });
        setTimeout(function () { return setLastUpdated(new Date()); }, 60000);
    }, [lastUpdated]);
    return React.createElement("main", { className: "container-fluid" },
        React.createElement("div", { className: "row" },
            React.createElement("div", { className: "col-lg-2 order-2 order-lg-0 align-self-center" },
                React.createElement(Badges, null)),
            React.createElement("section", { className: "content col-lg-9 col-12 order-sm-0 order-lg-1" },
                React.createElement("section", { className: "top" },
                    React.createElement("img", { id: "dapp-logo", src: DAPP_LOGO_URL }),
                    React.createElement("p", { id: "wombattle-description" }, GAME),
                    React.createElement("div", { id: "pool", className: "alert alert-info", role: "alert" }, "Prize pool: 50 EOS"),
                    React.createElement(Countdown, { start: 1591970400000, end: 1592226000000 })),
                React.createElement("div", { className: "row" }, Channels.map(function (channel, id) { return (React.createElement("div", { className: "col-lg-6 col-xl-4 col-md-12 order-" + (4 - id) },
                    React.createElement(LeaderBoard, { channelIndex: id, data: leaderboardData
                            .filter(function (data) { return data.channel === id; })
                            .map(function (data, rank) { return apiDataToEntry(data, rank, id); }) }))); })),
                React.createElement("footer", { className: "alert alert-light", role: "alert" },
                    React.createElement("a", { href: "https://getwombat.io" },
                        React.createElement("img", { id: "wombattle-logo", src: "https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png", alt: "" })),
                    React.createElement("div", { id: "updated" },
                        "Last updated ",
                        lastUpdated.toString()))),
            React.createElement("aside", { className: "col-lg-1 order-2" })));
};
ReactDOM.render(React.createElement(LeaderboardContainer, null), document.body);
