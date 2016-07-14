'use strict';

/**
 * when run a couple of tasks on the page, it may refresh. At this moment, we need find the break point of tasks and continue to deal the tasks.
 *
 * TODO compability
 */

let id = v => v;

const local = (typeof window === 'object' && window && window.localStorage) || {};

let defMemory = {
    set: (key, value) => {
        local[key] = value;
    },
    get: (key) => {
        return local[key];
    }
};

/**
 * fragment index:
 *
 * start -> start + 1 -> ...... -> start + fragment.length
 */
let getFragmentIndex = (breakIndex, start) => {
    return breakIndex - start;
};

module.exports = (memory, key, works, start = 0, end) => {
    end = end || works.length - 1; //last one
    memory = memory || defMemory;

    let genBreakhandle = (deal) => {
        // get the index, find the break point
        return Promise.resolve(memory.get(key)).then((index = 0) => {
            let breakIndex = index;

            let breakHandle = () => {
                let work = works[index];
                let ret = deal(work, index, works);
                // handle the work
                return Promise.resolve(ret).then((res) => {
                    index++;
                    // save the work progress
                    memory.set(key, index);
                    return {
                        res,
                        index,
                        breakIndex // record break point
                    };
                });
            };

            return {
                breakIndex, breakHandle
            };
        });
    };

    let handleBreakList = (deal, toNextMoment = id) => {
        return genBreakhandle(deal).then(({
            breakIndex, breakHandle
        }) => {
            let fragment = works.slice(start, end + 1);

            let frgIndex = getFragmentIndex(breakIndex, start);

            if (frgIndex >= fragment.length) return Promise.resolve({
                resList: [],
                breakIndex
            });

            return breakHandle().then(({
                index, res
            }) => {
                let frgIndex = getFragmentIndex(index, start);
                if (frgIndex < fragment.length) {
                    let time = toNextMoment(fragment[frgIndex]);
                    return Promise.resolve(time).then(() => {
                        return handleBreakList(deal, toNextMoment).then(({
                            resList, breakIndex
                        }) => {
                            resList.unshift(res);
                            return {
                                resList,
                                breakIndex
                            };
                        });
                    });
                } else {
                    // the last one
                    return {
                        breakIndex,
                        resList: [res]
                    };
                }
            });
        });
    };

    return {
        genBreakhandle,
        handleBreakList
    };
};
