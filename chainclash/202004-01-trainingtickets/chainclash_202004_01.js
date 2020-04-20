"use strict";
var root = document.body;
function loadData() {
    return m.request({
        method: 'GET',
        url: 'https://reporting.getwombat.io/challenges/chainclash-202004-01'
    });
}
var Leaderboard = function (intialVnode) {
    var paidSlots = 10;
    var prizeEos = 5;
    var interval;
    var leaderboardData;
    function refresh() {
        intialVnode.attrs.refresh()
            .then(function (leaderboard) {
            leaderboard
                .slice(0, paidSlots)
                .forEach(function (entry, index) {
                entry.isWinning = true;
                if (index < 10) {
                    entry.prize = prizeEos;
                }
            });
            leaderboardData = leaderboard;
        });
    }
    return {
        oninit: function () {
            refresh();
            interval = setInterval(refresh, 60000);
        },
        onremove: function () {
            if (interval) {
                clearInterval(interval);
            }
        },
        view: function () {
            return m('#leaderboard', m(Tables.Table, { leaderboardData: leaderboardData }));
        }
    };
};
var Tables;
(function (Tables) {
    Tables.Table = {
        view: function (vnode) {
            var entries;
            if (vnode.attrs.leaderboardData) {
                entries = vnode.attrs.leaderboardData.map(function (entry, index) {
                    return m(DataRow, { entry: entry, index: index });
                });
            }
            else {
                entries = [m('tr', m('td', { colspan: 4 }, 'Please wait, loading data...'))];
            }
            return m('table.table.table-light.table-hover', [
                m('thead', m(HeaderRow)),
                m('tbody', entries)
            ]);
        }
    };
    var DataRow = {
        view: function (vnode) {
            var _a = vnode.attrs, entry = _a.entry, index = _a.index;
            return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
                m('td', index + 1),
                m('td.account', entry.account),
                m('td', entry.usedTokens),
                m('td', entry.prize ? entry.prize.toFixed(4) : undefined)
            ]);
        }
    };
    var HeaderRow = {
        view: function () {
            return m('tr', [
                m('th', '#'),
                m('th', 'Player'),
                m('th', 'Used training tickets'),
                m('th', 'Prize')
            ]);
        }
    };
})(Tables || (Tables = {}));
var START_TIME = 1587391200000;
var END_TIME = 1587736800000;
var Countdown = function () {
    var timerId;
    var current;
    var finished = new Date().getTime() >= END_TIME;
    var started = new Date().getTime() >= START_TIME;
    function c(time, onEnd) {
        timerId = countdown(function (ts) {
            current = ts;
            if (ts.value <= 0) {
                onEnd();
                clearTimeout(timerId);
            }
            m.redraw();
        }, time, countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS);
    }
    function startCountdownToEnd() {
        c(END_TIME, function () {
            finished = true;
        });
    }
    function startCountdownToStart() {
        c(START_TIME, function () {
            started = true;
            startCountdownToEnd();
        });
    }
    return {
        oninit: function () {
            if (!started) {
                startCountdownToStart();
            }
            else if (!finished) {
                startCountdownToEnd();
            }
        },
        onremove: function () {
            clearTimeout(timerId);
        },
        view: function () {
            if (!started) {
                if (current) {
                    return m('div', { id: 'countdown', class: 'alert alert-info', role: 'alert' }, "Challenge starts in " + current.days + " days, " + current.hours + " hours, " + current.minutes + " minutes and " + current.seconds + " seconds");
                }
            }
            else if (finished) {
                return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' }, m('strong', '️The challenge has ended.'));
            }
            else if (current) {
                return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' }, [
                    m('strong', 'Join now!'),
                    "Challenge ends in " + current.days + " days, " + current.hours + " hours, " + current.minutes + " minutes and " + current.seconds + " seconds"
                ]);
            }
        }
    };
};
var LeaderboardContainer = function () {
    var lastUpdated;
    function refresh() {
        return loadData()
            .then(function (leaderboard) {
            lastUpdated = new Date();
            return leaderboard;
        });
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
                    m('div#updated', "Last Updated: " + lastUpdated)
                ])
            ]);
        }
    };
};
var Description = {
    view: function () {
        return [
            m('.prize-pool.alert.alert-warning', '50 EOS PRIZE POOL'),
            m(StoreBadges)
        ];
    }
};
var Layout = {
    view: function () {
        return m('main', [
            m('.dapp-logo', m('img', { src: 'https://wombattles.getwombat.io/leaderboard/assets/chainclash-logo.png' })),
            m('h1.leaderboard-heading', 'Leaderboard'),
            m(LeaderboardContainer),
            m(Description)
        ]);
    }
};
var StoreBadges = {
    view: function () {
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
        ]);
    }
};
if (!window.m || !window.countdown) {
    root.innerText = 'Mithril could not be loaded. Please check if you are blocking Javascript from certain sources.';
}
else {
    m.mount(root, Layout);
}
