"use strict";
var root = document.body;
var query = m.parseQueryString(document.location.search);
var prizePool = query.pool ? parseInt(query.pool) : 50.0;
function loadData() {
    return m.request({
        method: 'GET',
        url: 'https://reporting.getwombat.io/challenges/eosrace-202002'
    });
}
function pad(n, z) {
    if (z === void 0) { z = 2; }
    return ('00' + n).slice(-z);
}
function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    return mins + '\'' + pad(secs) + '.' + pad(ms, 3);
}
var Leaderboard = function (intialVnode) {
    var leaderboardData;
    function refresh() {
        intialVnode.attrs.refresh()
            .then(function (leaderboard) {
            leaderboard
                .slice(0, 50)
                .filter(function (entry) {
                return entry.total_score !== null;
            })
                .forEach(function (entry, index) {
                entry.isWinning = true;
                entry.percentageOfPrize = weight(index + 1);
            });
            leaderboardData = leaderboard;
        });
    }
    function weight(rank) {
        switch (true) {
            case (rank == 1):
                return 0.16;
            case (rank == 2):
                return 0.08;
            case (rank == 3):
                return 0.04;
            case (rank < 11):
                return 0.03;
            case (rank < 21):
                return 0.024;
            case (rank < 31):
                return 0.02;
            case (rank < 51):
                return 0.0035;
            default:
                return 0;
        }
    }
    return {
        oninit: function () {
            refresh();
            setInterval(refresh, 5000);
        },
        view: function (vnode) {
            var entries;
            if (leaderboardData) {
                entries = leaderboardData.map(function (entry, index) {
                    return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
                        m('td', index + 1),
                        m('td.account', entry.selected_for),
                        m('td', m(TimeWithTx, { time: entry.first_race, txId: entry.first_tx })),
                        m('td', m(TimeWithTx, { time: entry.second_race, txId: entry.second_tx })),
                        m('td', m(TimeWithTx, { time: entry.third_race, txId: entry.third_tx })),
                        m('td', entry.total_score ? msToTime(entry.total_score) : ''),
                        m('td', entry.percentageOfPrize ? (entry.percentageOfPrize * vnode.attrs.prizePool).toFixed(4) : undefined)
                    ]);
                });
            }
            else {
                entries = [m('tr', m('td', { colspan: 7 }, 'Please wait, loading data...'))];
            }
            return m('#leaderboard', m('table.table.table-light.table-hover', [
                m('thead', m('tr', [
                    m('th', '#'),
                    m('th', 'Racer'),
                    m('th', 'Fastest Race #1'),
                    m('th', 'Fastest Race #2'),
                    m('th', 'Fastest Race #3'),
                    m('th', 'Total time'),
                    m('th', 'Current EOS share')
                ])),
                m('tbody', entries)
            ]));
        }
    };
};
var TimeWithTx = {
    view: function (vnode) {
        if (vnode.attrs.time !== null) {
            return m('a', {
                target: '_blank',
                href: "https://bloks.io/transaction/" + vnode.attrs.txId
            }, msToTime(vnode.attrs.time));
        }
        else {
            return '-';
        }
    }
};
var Countdown = function () {
    var timerId;
    var current;
    return {
        oninit: function () {
            timerId = countdown(function (ts) {
                current = ts;
                m.redraw();
            }, 1575626400000, countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS);
        },
        onremove: function () {
            clearTimeout(timerId);
        },
        view: function () {
            if (current) {
                return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' }, [
                    m('strong', '🏎️🏎️🏎️ Join now! '),
                    "Challenge ends in " + current.days + " days, " + current.hours + " hours, " + current.minutes + " minutes and " + current.seconds + " seconds \uD83C\uDFCE\uFE0F\uD83C\uDFCE\uFE0F\uD83C\uDFCE\uFE0F"
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
            return [
                m('img#dapp-logo', { src: 'https://www.eosracing.io/eosracing/images/logo.png' }),
                m('p#subtitle', "The EOS Racing Wombattle will run from December, 2nd 10 am UTC until December, 6th 10 am UTC"),
                m('#pool.alert.alert-info', { role: 'alert' }, "Prize Pool: " + prizePool + " EOS"),
                m('.rule', 'Get your free EOS account from ', [
                    m('a', { href: 'https://getwombat.io?ref=wombattle-eos-racing' }, 'Wombat')
                ]),
                m('.rule', 'Finish at least 1 race or competition'),
                m('.rule', 'Be the fastest racer on the street'),
                m(Countdown),
                m(Leaderboard, { refresh: refresh, prizePool: prizePool }),
                m('#footer.alert.alert-light', { role: 'alert' }, [
                    m('a', { href: 'https://getwombat.io' }, [
                        m('img#wombattle-logo', { src: 'https://wombattles.getwombat.io/leaderboard/assets/wombattle-logo-300x65.png' })
                    ]),
                    m('div#updated', "Last Updated: " + lastUpdated)
                ]),
            ];
        }
    };
};
var Layout = {
    view: function (vnode) {
        return m('main', [
            m(StoreBadges),
            m('section.content', vnode.children),
            m('aside.empty')
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
var Page = {
    view: function () {
        return m(Layout, m(LeaderboardContainer));
    }
};
if (!window.m || !window.countdown) {
    root.innerText = 'Mithril could not be loaded. Please check if you are blocking Javascript from certain sources.';
}
else {
    m.mount(root, Page);
}
