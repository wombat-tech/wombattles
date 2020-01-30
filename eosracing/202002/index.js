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
    var paidSlots = 30;
    var leaderboardData;
    function refresh() {
        intialVnode.attrs.refresh()
            .then(function (leaderboard) {
            leaderboard
                .slice(0, paidSlots)
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
                return 0.2;
            case (rank == 2):
                return 0.16;
            case (rank == 3):
                return 0.12;
            case (rank < 8):
                return 0.06;
            case (rank < 13):
                return 0.04;
            case (rank < 18):
                return 0.02;
            case (rank < 23):
                return 0.01;
            case (rank < 31):
                return 0.005;
            default:
                return 0;
        }
    }
    var mql;
    var narrow = false;
    function setNarrow(e) {
        narrow = e.matches;
        m.redraw();
    }
    return {
        oninit: function () {
            refresh();
            setInterval(refresh, 5000);
        },
        oncreate: function () {
            mql = window.matchMedia('(max-width: 650px)');
            if (mql.matches) {
                narrow = true;
            }
            mql.addEventListener('change', setNarrow);
        },
        onremove: function () {
            if (mql) {
                mql.removeEventListener('change', setNarrow);
            }
        },
        view: function (vnode) {
            var table;
            if (narrow) {
                table = m(Tables.NarrowTable, { leaderboardData: leaderboardData, prizePool: vnode.attrs.prizePool });
            }
            else {
                table = m(Tables.WideTable, { leaderboardData: leaderboardData, prizePool: vnode.attrs.prizePool });
            }
            return m('#leaderboard', table);
        }
    };
};
var Tables;
(function (Tables) {
    Tables.WideTable = {
        view: function (vnode) {
            var entries;
            if (vnode.attrs.leaderboardData) {
                entries = vnode.attrs.leaderboardData.map(function (entry, index) {
                    return m(WideDataRow, { entry: entry, index: index, prizePool: vnode.attrs.prizePool });
                });
            }
            else {
                entries = [m('tr', m('td', { colspan: 7 }, 'Please wait, loading data...'))];
            }
            return m('table.table.table-light.table-hover', [
                m('thead', m(WideHeaderRow)),
                m('tbody', entries)
            ]);
        }
    };
    var WideDataRow = {
        view: function (vnode) {
            var _a = vnode.attrs, entry = _a.entry, index = _a.index, prizePool = _a.prizePool;
            return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
                m('td', index + 1),
                m('td.account', entry.selected_for),
                m('td', m(TimeWithTx, { time: entry.first_race, txId: entry.first_tx })),
                m('td', m(TimeWithTx, { time: entry.second_race, txId: entry.second_tx })),
                m('td', m(TimeWithTx, { time: entry.third_race, txId: entry.third_tx })),
                m('td', entry.total_score ? msToTime(entry.total_score) : ''),
                m('td', entry.percentageOfPrize ? (entry.percentageOfPrize * prizePool).toFixed(4) : undefined)
            ]);
        }
    };
    var WideHeaderRow = {
        view: function () {
            return m('tr', [
                m('th', '#'),
                m('th', 'Racer'),
                m('th', 'Fastest Race #1'),
                m('th', 'Fastest Race #2'),
                m('th', 'Fastest Race #3'),
                m('th', 'Total time'),
                m('th', 'Current EOS share')
            ]);
        }
    };
    var NarrowHeaderRow = {
        view: function (vnode) {
            return m('tr', [
                m('th', '#'),
                m('th', 'Racer'),
                m('th', 'Total time'),
                m('th', 'EOS share')
            ]);
        }
    };
    var NarrowDataRow = {
        view: function (vnode) {
            var _a = vnode.attrs, entry = _a.entry, index = _a.index, prizePool = _a.prizePool;
            return m('tr', { class: entry.isWinning ? 'table-success' : '' }, [
                m('td', index + 1),
                m('td.account', entry.selected_for),
                m('td', entry.total_score ? msToTime(entry.total_score) : ''),
                m('td', entry.percentageOfPrize ? (entry.percentageOfPrize * prizePool).toFixed(4) : undefined)
            ]);
        }
    };
    Tables.NarrowTable = {
        view: function (vnode) {
            var entries;
            if (vnode.attrs.leaderboardData) {
                entries = vnode.attrs.leaderboardData.map(function (entry, index) {
                    return m(NarrowDataRow, { entry: entry, index: index, prizePool: vnode.attrs.prizePool });
                });
            }
            else {
                entries = [m('tr', m('td', { colspan: 4 }, 'Please wait, loading data...'))];
            }
            return m('table.table.table-light.table-hover.table-sm', [
                m('thead', m(NarrowHeaderRow)),
                m('tbody', entries)
            ]);
        }
    };
})(Tables || (Tables = {}));
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
var START_TIME = 1580724000000;
var END_TIME = 1581069600000;
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
                    return m('div', { id: 'countdown', class: 'alert alert-info', role: 'alert' }, "Challenge starts in " + current.days + " days, " + current.hours + " hours, " + current.minutes + " minutes and " + current.seconds + " seconds \uD83C\uDFCE\uFE0F\uD83C\uDFCE\uFE0F\uD83C\uDFCE\uFE0F");
                }
            }
            else if (finished) {
                return m('div', { id: 'countdown', class: 'alert alert-warning', role: 'alert' }, m('strong', '🏎️🏎️🏎️The challenge has ended.'));
            }
            else if (current) {
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
                m('p#subtitle', "The EOS Racing Wombattle will run from February, 3rd 10 am UTC until Februray, 7th 10 am UTC"),
                m('#pool.alert.alert-info', { role: 'alert' }, "Prize Pool: " + prizePool + " EOS"),
                m('.rule', 'Get your free EOS account from ', [
                    m('a', { href: 'https://getwombat.io?ref=wombattle-eos-racing' }, 'Wombat')
                ]),
                m('.rule', 'Finish at least 3 races or competitions'),
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
