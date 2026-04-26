import type { Route } from '../types/wayPoint';

const ROUTE_CACHE_KEY = 'active_route_cache';

export function getCachedRoute(): Route | null {
    try {
        const raw = localStorage.getItem(ROUTE_CACHE_KEY);
        return raw ? (JSON.parse(raw) as Route) : null;
    } catch { return null; }
}

export function setCachedRoute(route: Route): void {
    try { localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(route)); } catch { }
}

export function clearCachedRoute(): void {
    localStorage.removeItem(ROUTE_CACHE_KEY);
}

export const MOCK_ROUTE: Route =
{
    "id": "route_generated_01",
    "totalDistanceMeters": 4051,
    "estimatedDurationSeconds": 3130,
    "waypoints": [
        {
            "coord": [
                121.516721,
                25.047202
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.516542,
                25.046589
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.517037,
                25.046474
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.517394,
                25.046378
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.517564,
                25.046333
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.517556,
                25.046261
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.517411,
                25.046297
            ],
            "mode": "metro",
            "role": "transition",
            "positioning": "beacon",
            "instruction": "進入 台北車站 站搭乘捷運",
            "station": "台北車站",
            "stationCode": "BL12"
        },
        {
            "coord": [
                121.517415,
                25.04631
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "台北車站",
            "stationCode": "BL12",
            "line": "BL"
        },
        {
            "coord": [
                121.523885,
                25.04468
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "善導寺",
            "stationCode": "BL13",
            "line": "BL"
        },
        {
            "coord": [
                121.5328,
                25.0423
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "忠孝新生",
            "stationCode": "BL14",
            "line": "BL"
        },
        {
            "coord": [
                121.543769,
                25.041633
            ],
            "mode": "metro",
            "role": "transfer",
            "positioning": "beacon",
            "station": "忠孝復興",
            "stationCode": "BL15",
            "fromLine": "BL",
            "toLine": "BR",
            "instruction": "於 忠孝復興 轉乘 BR 線"
        },
        {
            "coord": [
                121.543703,
                25.041104
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "忠孝復興",
            "stationCode": "BR10",
            "line": "BR"
        },
        {
            "coord": [
                121.544303,
                25.052044
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "南京復興",
            "stationCode": "BR11",
            "line": "BR"
        },
        {
            "coord": [
                121.544215,
                25.06085
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "中山國中",
            "stationCode": "BR12",
            "line": "BR"
        },
        {
            "coord": [
                121.55162,
                25.063111
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "松山機場",
            "stationCode": "BR13",
            "line": "BR"
        },
        {
            "coord": [
                121.54679,
                25.07943
            ],
            "mode": "metro",
            "role": "waypoint",
            "positioning": "beacon",
            "station": "大直",
            "stationCode": "BR14",
            "line": "BR"
        },
        {
            "coord": [
                121.555582,
                25.08483
            ],
            "mode": "walk",
            "role": "transition",
            "positioning": "gps",
            "station": "劍南路",
            "stationCode": "BR15",
            // "line": "BR",
            "instruction": "離開 劍南路 站"
        },
        {
            "coord": [
                121.555963,
                25.08467
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.55609,
                25.084628
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.556231,
                25.084586
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.556201,
                25.084489
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.556039,
                25.084533
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.555837,
                25.084533
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.555393,
                25.084665
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.555314,
                25.084738
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.555157,
                25.084784
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.555125,
                25.084696
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.555075,
                25.084711
            ],
            "mode": "bike",
            "role": "transition",
            "positioning": "gps",
            "instruction": "請在此租借 YouBike 並開始騎乘"
        },
        {
            "coord": [
                121.554489,
                25.084885
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.554488,
                25.08481
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.554429,
                25.084829
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.554423,
                25.084605
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.554409,
                25.084035
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.554407,
                25.083964
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.554331,
                25.08397
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.553759,
                25.084044
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.553276,
                25.084124
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.553172,
                25.084128
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.552959,
                25.084103
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.552772,
                25.084046
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.552465,
                25.083802
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.552287,
                25.083524
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.552273,
                25.083462
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.552197,
                25.083478
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.5509,
                25.083768
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550765,
                25.083798
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550671,
                25.083819
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550349,
                25.08389
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549885,
                25.083997
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549714,
                25.084036
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549452,
                25.084097
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549371,
                25.084114
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549269,
                25.084139
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549186,
                25.084156
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54882,
                25.0842
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548765,
                25.084204
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548784,
                25.084272
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548903,
                25.084638
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549136,
                25.085042
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549195,
                25.085152
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549212,
                25.085229
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549198,
                25.085332
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549153,
                25.08541
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54834,
                25.086064
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54839,
                25.086116
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548576,
                25.086309
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548832,
                25.086493
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548954,
                25.086525
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549015,
                25.086547
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548958,
                25.086705
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548956,
                25.086994
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548447,
                25.094434
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548442,
                25.094529
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548438,
                25.094613
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548426,
                25.094613
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548422,
                25.094669
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548897,
                25.094924
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548914,
                25.094962
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548914,
                25.094966
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54889,
                25.095277
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548829,
                25.095639
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548798,
                25.095707
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548735,
                25.095783
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548666,
                25.09584
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548645,
                25.095825
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548511,
                25.095925
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548502,
                25.095949
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548408,
                25.096113
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548351,
                25.096331
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54837,
                25.096527
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548382,
                25.096592
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548434,
                25.096697
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548542,
                25.096848
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548592,
                25.096947
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548631,
                25.097077
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548624,
                25.097243
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548583,
                25.097364
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548506,
                25.097496
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548131,
                25.098002
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548008,
                25.098086
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.547875,
                25.098262
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54783,
                25.09832
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.547664,
                25.098523
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.547595,
                25.09858
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54766,
                25.09862
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549123,
                25.099394
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549173,
                25.099422
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549261,
                25.099473
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549644,
                25.099711
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550096,
                25.100003
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550188,
                25.100062
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.55057,
                25.100311
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550903,
                25.100532
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550938,
                25.100555
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550973,
                25.100577
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.55196,
                25.101169
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.551923,
                25.101218
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.551883,
                25.101269
            ],
            "mode": "bike",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.55161,
                25.101103
            ],
            "mode": "walk",
            "role": "transition",
            "positioning": "gps",
            "instruction": "請在此歸還 YouBike 並改為步行"
        },
        {
            "coord": [
                121.551522,
                25.101049
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550988,
                25.100724
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550904,
                25.100672
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550833,
                25.100629
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550589,
                25.100476
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550263,
                25.100271
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.55018,
                25.100364
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.550021,
                25.100262
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549992,
                25.100273
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549965,
                25.100297
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549899,
                25.100403
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549785,
                25.100361
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549538,
                25.100273
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549531,
                25.100285
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549502,
                25.100342
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549433,
                25.100487
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549419,
                25.10052
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549393,
                25.100581
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549331,
                25.100701
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549284,
                25.100791
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549261,
                25.100834
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548951,
                25.101433
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548923,
                25.101482
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548898,
                25.10153
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549104,
                25.10162
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549076,
                25.10168
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.549026,
                25.101659
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548907,
                25.101608
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548854,
                25.101588
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548847,
                25.101601
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548837,
                25.101619
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548763,
                25.10159
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.54864,
                25.101542
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.5486,
                25.101524
            ],
            "mode": "walk",
            "role": "waypoint",
            "positioning": "gps"
        },
        {
            "coord": [
                121.548552,
                25.101617
            ],
            "mode": "walk",
            "role": "destination",
            "positioning": "gps"
        }
    ]
}
export async function fetchRoute(
    userLat: number, userLng: number, // 拿掉底線，代表開始使用這些變數
    destLat: number, destLng: number,
): Promise<Route> {
    try {
        // 1. 組裝 API 網址 (將參數帶入 query string)
        const url = `/api/navigation?start_lat=${userLat}&start_lng=${userLng}&end_lat=${destLat}&end_lng=${destLng}`;

        // 2. 發送 GET 請求
        const response = await fetch(url);

        // 3. 檢查 HTTP 狀態碼是否成功 (200-299)
        if (!response.ok) {
            throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
        }

        // 4. 解析 JSON 回傳真實結果
        const data: Route = await response.json();
        setCachedRoute(data);
        console.log(data)
        return data;

    } catch (error) {
        console.error("無法取得導航路線:", error);
        console.warn("使用假資料 (MOCK_ROUTE) 作為備案");
        setCachedRoute(MOCK_ROUTE);
        return MOCK_ROUTE;
    }
}
