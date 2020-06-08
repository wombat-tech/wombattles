"use strict";
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
    return React.createElement("div", { id: "leaderboard" },
        React.createElement("table", { className: "table table-light table-hover" },
            React.createElement("thead", null,
                React.createElement("tr", null,
                    React.createElement("th", null, "#"),
                    React.createElement("th", null, "Account"),
                    React.createElement("th", null, "Time mined"))),
            React.createElement("tbody", null, props.data.map(function (entry, i) { return (React.createElement("tr", null,
                React.createElement("td", null, i + 1),
                React.createElement("td", null, entry.account),
                React.createElement("td", null, entry.duration))); }))));
};
var LeaderboardContainer = function () {
    var _a = React.useState(new Date()), lastUpdated = _a[0], setLastUpdated = _a[1];
    var _b = React.useState([]), leaderboardData = _b[0], setLeaderBoardData = _b[1];
    React.useEffect(function () {
        fetch('https://dashboard.getwombat.io/api/wombattles/prospectors-202006-birthday')
            .then(function (res) { return res.json(); })
            .then(function (data) { return setLeaderBoardData(data); });
        setTimeout(function () { return setLastUpdated(new Date()); }, 60000);
    }, [lastUpdated]);
    return React.createElement("main", null,
        React.createElement(Badges, null),
        React.createElement("section", { className: "content" },
            React.createElement("section", { className: "top" },
                React.createElement("img", { id: "dapp-logo", src: "https://prospectors.io/assets/logo_with_icon-93f1a77ffc0259d6c4d44ef56b4020e8a20d7b8576cbc39917ba71c9d15b8606.png" }),
                React.createElement(Countdown, { start: 1591711200000, end: 1591884000000 })),
            React.createElement(LeaderBoard, { data: leaderboardData }),
            React.createElement("footer", { className: "alert alert-light", role: "alert" },
                React.createElement("a", { href: "https://getwombat.io" },
                    React.createElement("img", { id: "wombattle-logo", src: "https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png", alt: "" })),
                React.createElement("div", { id: "updated" },
                    "Last updated ",
                    lastUpdated.toString()))),
        React.createElement("aside", { className: "empty" }));
};
ReactDOM.render(React.createElement(LeaderboardContainer, null), document.body);
