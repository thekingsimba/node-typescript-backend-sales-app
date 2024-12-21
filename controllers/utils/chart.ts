import { arrayRange } from "./arrayRange"
import Logger from "./logger";

export const weekly_data = (data: any, start_date: number, last_date: number) => {
  const formedArray = arrayRange(start_date, last_date, 1);
  let day1 = { completed: 0, rejected: 0 }, 
    day2 = { completed: 0, rejected: 0 }, 
    day3 = { completed: 0, rejected: 0 },
    day4 = { completed: 0, rejected: 0 }, 
    day5 = { completed: 0, rejected: 0 }, 
    day6 = { completed: 0, rejected: 0 },
    day7 = { completed: 0, rejected: 0 };
  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    if (new Date(order.createdAt).getDate() === formedArray[0] && order.status.toLowerCase() === "delivered") {
      day1.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[0] && order.status.toLowerCase() === "rejected") {
      day1.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[1] && order.status.toLowerCase() === "delivered") {
      day2.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[1] && order.status.toLowerCase() === "rejected") {
      day2.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[2] && order.status.toLowerCase() === "delivered") {
      day3.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[2] && order.status.toLowerCase() === "rejected") {
      day3.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[3] && order.status.toLowerCase() === "delivered") {
      day4.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[3] && order.status.toLowerCase() === "rejected") {
      day4.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[4] && order.status.toLowerCase() === "delivered") {
      day5.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[4] && order.status.toLowerCase() === "rejected") {
      day5.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[5] && order.status.toLowerCase() === "delivered") {
      day6.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[5] && order.status.toLowerCase() === "rejected") {
      day6.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[6] && order.status.toLowerCase() === "delivered") {
      day7.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[6] && order.status.toLowerCase() === "rejected") {
      day7.rejected += 1;
    }
  };
  return [ day1, day2, day3, day4, day5, day6, day7 ]
}

export const last_month_data = (data: any, start_date: number, last_date: number) => {
  const formedArray = arrayRange(start_date, last_date, 1);
  let day1 = { completed: 0, rejected: 0 }, 
    day2 = { completed: 0, rejected: 0 }, 
    day3 = { completed: 0, rejected: 0 },
    day4 = { completed: 0, rejected: 0 }, 
    day5 = { completed: 0, rejected: 0 }, 
    day6 = { completed: 0, rejected: 0 },
    day7 = { completed: 0, rejected: 0 },
    day8 = { completed: 0, rejected: 0 }, 
    day9 = { completed: 0, rejected: 0 },
    day10 = { completed: 0, rejected: 0 }, 
    day11 = { completed: 0, rejected: 0 }, 
    day12 = { completed: 0, rejected: 0 },
    day13 = { completed: 0, rejected: 0 },
    day14 = { completed: 0, rejected: 0 },
    day15 = { completed: 0, rejected: 0 }, 
    day16 = { completed: 0, rejected: 0 },
    day17 = { completed: 0, rejected: 0 }, 
    day18 = { completed: 0, rejected: 0 }, 
    day19 = { completed: 0, rejected: 0 },
    day20 = { completed: 0, rejected: 0 },
    day21 = { completed: 0, rejected: 0 }, 
    day22 = { completed: 0, rejected: 0 },
    day23 = { completed: 0, rejected: 0 },
    day24 = { completed: 0, rejected: 0 },
    day25 = { completed: 0, rejected: 0 }, 
    day26 = { completed: 0, rejected: 0 },
    day27 = { completed: 0, rejected: 0 }, 
    day28 = { completed: 0, rejected: 0 }, 
    day29 = { completed: 0, rejected: 0 },
    day30 = { completed: 0, rejected: 0 },
    day31 = { completed: 0, rejected: 0 };
  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    if (new Date(order.createdAt).getDate() === formedArray[0] && order.status.toLowerCase() === "delivered") {
      day1.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[0] && order.status.toLowerCase() === "rejected") {
      day1.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[1] && order.status.toLowerCase() === "delivered") {
      day2.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[1] && order.status.toLowerCase() === "rejected") {
      day2.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[2] && order.status.toLowerCase() === "delivered") {
      day3.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[2] && order.status.toLowerCase() === "rejected") {
      day3.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[3] && order.status.toLowerCase() === "delivered") {
      day4.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[3] && order.status.toLowerCase() === "rejected") {
      day4.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[4] && order.status.toLowerCase() === "delivered") {
      day5.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[4] && order.status.toLowerCase() === "rejected") {
      day5.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[5] && order.status.toLowerCase() === "delivered") {
      day6.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[5] && order.status.toLowerCase() === "rejected") {
      day6.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[6] && order.status.toLowerCase() === "delivered") {
      day7.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[6] && order.status.toLowerCase() === "rejected") {
      day7.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[7] && order.status.toLowerCase() === "delivered") {
      day8.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[7] && order.status.toLowerCase() === "rejected") {
      day8.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[8] && order.status.toLowerCase() === "delivered") {
      day9.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[8] && order.status.toLowerCase() === "rejected") {
      day9.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[9] && order.status.toLowerCase() === "delivered") {
      day10.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[9] && order.status.toLowerCase() === "rejected") {
      day10.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[10] && order.status.toLowerCase() === "delivered") {
      day11.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[10] && order.status.toLowerCase() === "rejected") {
      day11.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[11] && order.status.toLowerCase() === "delivered") {
      day12.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[11] && order.status.toLowerCase() === "rejected") {
      day12.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[12] && order.status.toLowerCase() === "delivered") {
      day13.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[12] && order.status.toLowerCase() === "rejected") {
      day13.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[13] && order.status.toLowerCase() === "delivered") {
      day14.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[13] && order.status.toLowerCase() === "rejected") {
      day14.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[14] && order.status.toLowerCase() === "delivered") {
      day15.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[14] && order.status.toLowerCase() === "rejected") {
      day15.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[15] && order.status.toLowerCase() === "delivered") {
      day16.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[15] && order.status.toLowerCase() === "rejected") {
      day16.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[16] && order.status.toLowerCase() === "delivered") {
      day17.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[16] && order.status.toLowerCase() === "rejected") {
      day17.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[17] && order.status.toLowerCase() === "delivered") {
      day18.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[17] && order.status.toLowerCase() === "rejected") {
      day18.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[18] && order.status.toLowerCase() === "delivered") {
      day19.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[18] && order.status.toLowerCase() === "rejected") {
      day19.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[19] && order.status.toLowerCase() === "delivered") {
      day20.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[19] && order.status.toLowerCase() === "rejected") {
      day20.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[20] && order.status.toLowerCase() === "delivered") {
      day21.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[20] && order.status.toLowerCase() === "rejected") {
      day21.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[21] && order.status.toLowerCase() === "delivered") {
      day22.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[21] && order.status.toLowerCase() === "rejected") {
      day22.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[22] && order.status.toLowerCase() === "delivered") {
      day23.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[22] && order.status.toLowerCase() === "rejected") {
      day23.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[23] && order.status.toLowerCase() === "delivered") {
      day24.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[23] && order.status.toLowerCase() === "rejected") {
      day24.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[24] && order.status.toLowerCase() === "delivered") {
      day25.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[24] && order.status.toLowerCase() === "rejected") {
      day25.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[25] && order.status.toLowerCase() === "delivered") {
      day26.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[25] && order.status.toLowerCase() === "rejected") {
      day26.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[26] && order.status.toLowerCase() === "delivered") {
      day27.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[26] && order.status.toLowerCase() === "rejected") {
      day27.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[27] && order.status.toLowerCase() === "delivered") {
      day28.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[27] && order.status.toLowerCase() === "rejected") {
      day28.rejected += 1;
    }

    if (formedArray[formedArray.length - 1] >= 29) {
      if (new Date(order.createdAt).getDate() === formedArray[28] && order.status.toLowerCase() === "delivered") {
        day29.completed += 1;
      } else if (new Date(order.createdAt).getDate() === formedArray[28] && order.status.toLowerCase() === "rejected") {
        day29.rejected += 1;
      }
    }

    if (formedArray[formedArray.length - 1] >= 30) {
      if (new Date(order.createdAt).getDate() === formedArray[29] && order.status.toLowerCase() === "delivered") {
        day30.completed += 1;
      } else if (new Date(order.createdAt).getDate() === formedArray[29] && order.status.toLowerCase() === "rejected") {
        day30.rejected += 1;
      }
    }

    if (formedArray[formedArray.length - 1] === 31) {
      if (new Date(order.createdAt).getDate() === formedArray[30] && order.status.toLowerCase() === "delivered") {
        day31.completed += 1;
      } else if (new Date(order.createdAt).getDate() === formedArray[30] && order.status.toLowerCase() === "rejected") {
        day31.rejected += 1;
      }
    }
  };
  return [ day1, day2, day3, day4, day5, day6, day7, day8, day9, day10, day11, day12, day13, day14, day15, day16, day17, day18, day19, day20, day21, day22, day23, day24, day25, day26, day27, day28, day29, day30 ];
}

export const this_month_data = (data: any, start_date: number, last_date: number) => {
  const formedArray = arrayRange(start_date, last_date, 1);
  let day1 = { completed: 0, rejected: 0 }, 
    day2 = { completed: 0, rejected: 0 }, 
    day3 = { completed: 0, rejected: 0 },
    day4 = { completed: 0, rejected: 0 }, 
    day5 = { completed: 0, rejected: 0 }, 
    day6 = { completed: 0, rejected: 0 },
    day7 = { completed: 0, rejected: 0 },
    day8 = { completed: 0, rejected: 0 }, 
    day9 = { completed: 0, rejected: 0 },
    day10 = { completed: 0, rejected: 0 }, 
    day11 = { completed: 0, rejected: 0 }, 
    day12 = { completed: 0, rejected: 0 },
    day13 = { completed: 0, rejected: 0 },
    day14 = { completed: 0, rejected: 0 },
    day15 = { completed: 0, rejected: 0 }, 
    day16 = { completed: 0, rejected: 0 },
    day17 = { completed: 0, rejected: 0 }, 
    day18 = { completed: 0, rejected: 0 }, 
    day19 = { completed: 0, rejected: 0 },
    day20 = { completed: 0, rejected: 0 },
    day21 = { completed: 0, rejected: 0 }, 
    day22 = { completed: 0, rejected: 0 },
    day23 = { completed: 0, rejected: 0 },
    day24 = { completed: 0, rejected: 0 },
    day25 = { completed: 0, rejected: 0 }, 
    day26 = { completed: 0, rejected: 0 },
    day27 = { completed: 0, rejected: 0 }, 
    day28 = { completed: 0, rejected: 0 }, 
    day29 = { completed: 0, rejected: 0 },
    day30 = { completed: 0, rejected: 0 },
    day31 = { completed: 0, rejected: 0 };
  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    if (new Date(order.createdAt).getDate() === formedArray[0] && order.status.toLowerCase() === "delivered") {
      day1.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[0] && order.status.toLowerCase() === "rejected") {
      day1.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[1] && order.status.toLowerCase() === "delivered") {
      day2.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[1] && order.status.toLowerCase() === "rejected") {
      day2.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[2] && order.status.toLowerCase() === "delivered") {
      day3.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[2] && order.status.toLowerCase() === "rejected") {
      day3.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[3] && order.status.toLowerCase() === "delivered") {
      day4.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[3] && order.status.toLowerCase() === "rejected") {
      day4.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[4] && order.status.toLowerCase() === "delivered") {
      day5.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[4] && order.status.toLowerCase() === "rejected") {
      day5.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[5] && order.status.toLowerCase() === "delivered") {
      day6.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[5] && order.status.toLowerCase() === "rejected") {
      day6.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[6] && order.status.toLowerCase() === "delivered") {
      day7.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[6] && order.status.toLowerCase() === "rejected") {
      day7.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[7] && order.status.toLowerCase() === "delivered") {
      day8.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[7] && order.status.toLowerCase() === "rejected") {
      day8.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[8] && order.status.toLowerCase() === "delivered") {
      day9.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[8] && order.status.toLowerCase() === "rejected") {
      day9.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[9] && order.status.toLowerCase() === "delivered") {
      day10.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[9] && order.status.toLowerCase() === "rejected") {
      day10.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[10] && order.status.toLowerCase() === "delivered") {
      day11.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[10] && order.status.toLowerCase() === "rejected") {
      day11.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[11] && order.status.toLowerCase() === "delivered") {
      day12.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[11] && order.status.toLowerCase() === "rejected") {
      day12.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[12] && order.status.toLowerCase() === "delivered") {
      day13.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[12] && order.status.toLowerCase() === "rejected") {
      day13.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[13] && order.status.toLowerCase() === "delivered") {
      day14.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[13] && order.status.toLowerCase() === "rejected") {
      day14.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[14] && order.status.toLowerCase() === "delivered") {
      day15.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[14] && order.status.toLowerCase() === "rejected") {
      day15.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[15] && order.status.toLowerCase() === "delivered") {
      day16.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[15] && order.status.toLowerCase() === "rejected") {
      day16.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[16] && order.status.toLowerCase() === "delivered") {
      day17.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[16] && order.status.toLowerCase() === "rejected") {
      day17.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[17] && order.status.toLowerCase() === "delivered") {
      day18.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[17] && order.status.toLowerCase() === "rejected") {
      day18.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[18] && order.status.toLowerCase() === "delivered") {
      day19.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[18] && order.status.toLowerCase() === "rejected") {
      day19.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[19] && order.status.toLowerCase() === "delivered") {
      day20.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[19] && order.status.toLowerCase() === "rejected") {
      day20.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[20] && order.status.toLowerCase() === "delivered") {
      day21.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[20] && order.status.toLowerCase() === "rejected") {
      day21.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[21] && order.status.toLowerCase() === "delivered") {
      day22.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[21] && order.status.toLowerCase() === "rejected") {
      day22.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[22] && order.status.toLowerCase() === "delivered") {
      day23.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[22] && order.status.toLowerCase() === "rejected") {
      day23.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[23] && order.status.toLowerCase() === "delivered") {
      day24.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[23] && order.status.toLowerCase() === "rejected") {
      day24.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[24] && order.status.toLowerCase() === "delivered") {
      day25.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[24] && order.status.toLowerCase() === "rejected") {
      day25.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[25] && order.status.toLowerCase() === "delivered") {
      day26.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[25] && order.status.toLowerCase() === "rejected") {
      day26.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[26] && order.status.toLowerCase() === "delivered") {
      day27.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[26] && order.status.toLowerCase() === "rejected") {
      day27.rejected += 1;
    }

    if (new Date(order.createdAt).getDate() === formedArray[27] && order.status.toLowerCase() === "delivered") {
      day28.completed += 1;
    } else if (new Date(order.createdAt).getDate() === formedArray[27] && order.status.toLowerCase() === "rejected") {
      day28.rejected += 1;
    }

    if (formedArray[formedArray.length - 1] >= 29) {
      if (new Date(order.createdAt).getDate() === formedArray[28] && order.status.toLowerCase() === "delivered") {
        day29.completed += 1;
      } else if (new Date(order.createdAt).getDate() === formedArray[28] && order.status.toLowerCase() === "rejected") {
        day29.rejected += 1;
      }
    }

    if (formedArray[formedArray.length - 1] >= 30) {
      if (new Date(order.createdAt).getDate() === formedArray[29] && order.status.toLowerCase() === "delivered") {
        day30.completed += 1;
      } else if (new Date(order.createdAt).getDate() === formedArray[29] && order.status.toLowerCase() === "rejected") {
        day30.rejected += 1;
      }
    }

    if (formedArray[formedArray.length - 1] === 31) {
      if (new Date(order.createdAt).getDate() === formedArray[30] && order.status.toLowerCase() === "delivered") {
        day31.completed += 1;
      } else if (new Date(order.createdAt).getDate() === formedArray[30] && order.status.toLowerCase() === "rejected") {
        day31.rejected += 1;
      }
    }
  };
  return [ day1, day2, day3, day4, day5, day6, day7, day8, day9, day10, day11, day12, day13, day14, day15, day16, day17, day18, day19, day20, day21, day22, day23, day24, day25, day26, day27, day28, day29, day30 ];
}

export const last_year_data = (data: any) => {
  let jan = { completed: 0, rejected: 0 },
    feb = { completed: 0, rejected: 0 },
    mar = { completed: 0, rejected: 0 },
    apr = { completed: 0, rejected: 0 },
    may = { completed: 0, rejected: 0 },
    jun = { completed: 0, rejected: 0 },
    jul = { completed: 0, rejected: 0 },
    aug = { completed: 0, rejected: 0 },
    sept = { completed: 0, rejected: 0 },
    oct = { completed: 0, rejected: 0 },
    nov = { completed: 0, rejected: 0 },
    dec = { completed: 0, rejected: 0 };

  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    if (new Date(order.createdAt).getMonth() === 0 && order.status.toLowerCase() === "delivered") {
      jan.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 0 && order.status.toLowerCase() === "rejected") {
      jan.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 1 && order.status.toLowerCase() === "delivered") {
      feb.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 1 && order.status.toLowerCase() === "rejected") {
      feb.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 2 && order.status.toLowerCase() === "delivered") {
      mar.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 2 && order.status.toLowerCase() === "rejected") {
      mar.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 3 && order.status.toLowerCase() === "delivered") {
      apr.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 3 && order.status.toLowerCase() === "rejected") {
      apr.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 4 && order.status.toLowerCase() === "delivered") {
      may.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 4 && order.status.toLowerCase() === "rejected") {
      may.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 5 && order.status.toLowerCase() === "delivered") {
      jun.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 5 && order.status.toLowerCase() === "rejected") {
      jun.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 6 && order.status.toLowerCase() === "delivered") {
      jul.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 6 && order.status.toLowerCase() === "rejected") {
      jul.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 7 && order.status.toLowerCase() === "delivered") {
      aug.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 7 && order.status.toLowerCase() === "rejected") {
      aug.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 8 && order.status.toLowerCase() === "delivered") {
      sept.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 8 && order.status.toLowerCase() === "rejected") {
      sept.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 9 && order.status.toLowerCase() === "delivered") {
      oct.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 9 && order.status.toLowerCase() === "rejected") {
      oct.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 10 && order.status.toLowerCase() === "delivered") {
      nov.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 10 && order.status.toLowerCase() === "rejected") {
      nov.rejected += 1;
    }

    if (new Date(order.createdAt).getMonth() === 11 && order.status.toLowerCase() === "delivered") {
      dec.completed += 1;
    } else if (new Date(order.createdAt).getMonth() === 11 && order.status.toLowerCase() === "rejected") {
      dec.rejected += 1;
    }
  }

  return [ jan, feb, mar, apr, may, jun, jul, aug, sept, oct, nov, dec ];
}

export const custom_date_data = (data: any) => {
  const obj = { completed: 0, rejected: 0 };
  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    if (order.status.toLowerCase() === "delivered") {
      obj.completed += 1;
    } else if (order.status.toLowerCase() === "rejected") {
      obj.rejected += 1;
    } 
  };
  return [ obj ]
}

export const annual_chart = (data: any) => {
  let jan = [],
    feb = [],
    mar = [],
    apr = [],
    may = [],
    jun = [],
    jul = [],
    aug = [],
    sept = [],
    oct = [],
    nov = [],
    dec = [];

  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    if (new Date(order.createdAt).getMonth() === 0) {
      jan.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 1) {
      feb.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 2) {
      mar.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 3) {
      apr.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 4) {
      may.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 5) {
      jun.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 6) {
      jul.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 7) {
      aug.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 8) {
      sept.push(order.subtotal);
    } else if (new Date(order.createdAt).getMonth() === 9) {
      oct.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 10) {
      nov.push(order.subtotal)
    } else if (new Date(order.createdAt).getMonth() === 11) {
      dec.push(order.subtotal)
    }
  }

  return [
    jan.reduce((a,b) => a+b,0).toFixed(2),
    feb.reduce((a,b) => a+b,0).toFixed(2),
    mar.reduce((a,b) => a+b,0).toFixed(2),
    apr.reduce((a,b) => a+b,0).toFixed(2),
    may.reduce((a,b) => a+b,0).toFixed(2),
    jun.reduce((a,b) => a+b,0).toFixed(2),
    jul.reduce((a,b) => a+b,0).toFixed(2),
    aug.reduce((a,b) => a+b,0).toFixed(2),
    sept.reduce((a,b) => a+b,0).toFixed(2),
    oct.reduce((a,b) => a+b,0).toFixed(2),
    nov.reduce((a,b) => a+b,0).toFixed(2),
    dec.reduce((a,b) => a+b,0).toFixed(2),
  ]
}
