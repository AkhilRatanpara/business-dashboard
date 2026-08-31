import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exact LB Bush data directly transcribed from PDF Page 09 & 10 (169 items)
const lbBushItems = [
  { srNo: "1", name: "L.B. BUSH 38x50x60", costPrice: 660, retailerPrice: 792, customerPrice: 990 },
  { srNo: "2", name: "L.B. BUSH 37.5x50x60", costPrice: 690, retailerPrice: 828, customerPrice: 1035 },
  { srNo: "3", name: "L.B. BUSH 37x50x60", costPrice: 720, retailerPrice: 864, customerPrice: 1080 },
  { srNo: "4", name: "L.B. BUSH 36.5x50x60", costPrice: 750, retailerPrice: 900, customerPrice: 1125 },
  { srNo: "5", name: "L.B. BUSH 36x50x60", costPrice: 780, retailerPrice: 936, customerPrice: 1170 },
  { srNo: "6", name: "L.B. BUSH 35.5x50x60", costPrice: 810, retailerPrice: 972, customerPrice: 1215 },
  { srNo: "7", name: "L.B. BUSH 35x50x60", costPrice: 850, retailerPrice: 1020, customerPrice: 1275 },
  { srNo: "8", name: "L.B. BUSH 38x50x50", costPrice: 550, retailerPrice: 660, customerPrice: 825 },
  { srNo: "9", name: "L.B. BUSH 37.5x50x50", costPrice: 575, retailerPrice: 690, customerPrice: 862.5 },
  { srNo: "10", name: "L.B. BUSH 37x50x50", costPrice: 600, retailerPrice: 720, customerPrice: 900 },
  { srNo: "11", name: "L.B. BUSH 36.5x50x50", costPrice: 625, retailerPrice: 750, customerPrice: 937.5 },
  { srNo: "12", name: "L.B. BUSH 36x50x50", costPrice: 650, retailerPrice: 780, customerPrice: 975 },
  { srNo: "13", name: "L.B. BUSH 35.5x50x50", costPrice: 675, retailerPrice: 810, customerPrice: 1012.5 },
  { srNo: "14", name: "L.B. BUSH 35x50x50", costPrice: 700, retailerPrice: 840, customerPrice: 1050 },
  { srNo: "15", name: "L.B. BUSH 38x50x40", costPrice: 440, retailerPrice: 528, customerPrice: 660 },
  { srNo: "16", name: "L.B. BUSH 37.5x50x40", costPrice: 460, retailerPrice: 552, customerPrice: 690 },
  { srNo: "17", name: "L.B. BUSH 37x50x40", costPrice: 480, retailerPrice: 576, customerPrice: 720 },
  { srNo: "18", name: "L.B. BUSH 36.5x50x40", costPrice: 500, retailerPrice: 600, customerPrice: 750 },
  { srNo: "19", name: "L.B. BUSH 36x50x40", costPrice: 520, retailerPrice: 624, customerPrice: 780 },
  { srNo: "20", name: "L.B. BUSH 35.5x50x40", costPrice: 540, retailerPrice: 648, customerPrice: 810 },
  { srNo: "21", name: "L.B. BUSH 35x50x40", costPrice: 560, retailerPrice: 672, customerPrice: 840 },
  { srNo: "22", name: "L.B. BUSH 38x48x40", costPrice: 400, retailerPrice: 480, customerPrice: 600 },
  { srNo: "23", name: "L.B. BUSH 37.5x48x40", costPrice: 420, retailerPrice: 504, customerPrice: 630 },
  { srNo: "24", name: "L.B. BUSH 37x48x40", costPrice: 440, retailerPrice: 528, customerPrice: 660 },
  { srNo: "25", name: "L.B. BUSH 36.5x48x40", costPrice: 460, retailerPrice: 552, customerPrice: 690 },
  { srNo: "26", name: "L.B. BUSH 36x48x40", costPrice: 480, retailerPrice: 576, customerPrice: 720 },
  { srNo: "27", name: "L.B. BUSH 35.5x48x40", costPrice: 500, retailerPrice: 600, customerPrice: 750 },
  { srNo: "28", name: "L.B. BUSH 35x48x40", costPrice: 520, retailerPrice: 624, customerPrice: 780 },
  { srNo: "29", name: "L.B. BUSH 38x45x60", costPrice: 420, retailerPrice: 504, customerPrice: 630 },
  { srNo: "30", name: "L.B. BUSH 37.5x45x60", costPrice: 435, retailerPrice: 522, customerPrice: 652.5 },
  { srNo: "31", name: "L.B. BUSH 37x45x60", costPrice: 455, retailerPrice: 546, customerPrice: 682.5 },
  { srNo: "32", name: "L.B. BUSH 36.5x45x60", costPrice: 475, retailerPrice: 570, customerPrice: 712.5 },
  { srNo: "33", name: "L.B. BUSH 36x45x60", costPrice: 495, retailerPrice: 594, customerPrice: 742.5 },
  { srNo: "34", name: "L.B. BUSH 35.5x45x60", costPrice: 515, retailerPrice: 618, customerPrice: 772.5 },
  { srNo: "35", name: "L.B. BUSH 35x45x60", costPrice: 535, retailerPrice: 642, customerPrice: 802.5 },
  { srNo: "36", name: "L.B. BUSH 38x45x50", costPrice: 350, retailerPrice: 420, customerPrice: 525 },
  { srNo: "37", name: "L.B. BUSH 37.5x45x50", costPrice: 365, retailerPrice: 438, customerPrice: 547.5 },
  { srNo: "38", name: "L.B. BUSH 37x45x50", costPrice: 380, retailerPrice: 456, customerPrice: 570 },
  { srNo: "39", name: "L.B. BUSH 36.5x45x50", costPrice: 395, retailerPrice: 474, customerPrice: 592.5 },
  { srNo: "40", name: "L.B. BUSH 36x45x50", costPrice: 410, retailerPrice: 492, customerPrice: 615 },
  { srNo: "41", name: "L.B. BUSH 35.5x45x50", costPrice: 425, retailerPrice: 510, customerPrice: 637.5 },
  { srNo: "42", name: "L.B. BUSH 35x45x50", costPrice: 440, retailerPrice: 528, customerPrice: 660 },
  { srNo: "43", name: "L.B. BUSH 38x45x40", costPrice: 280, retailerPrice: 336, customerPrice: 420 },
  { srNo: "44", name: "L.B. BUSH 37.5x45x40", costPrice: 290, retailerPrice: 348, customerPrice: 435 },
  { srNo: "45", name: "L.B. BUSH 37x45x40", costPrice: 300, retailerPrice: 360, customerPrice: 450 },
  { srNo: "46", name: "L.B. BUSH 36.5x45x40", costPrice: 310, retailerPrice: 372, customerPrice: 465 },
  { srNo: "47", name: "L.B. BUSH 36x45x40", costPrice: 320, retailerPrice: 384, customerPrice: 480 },
  { srNo: "48", name: "L.B. BUSH 35.5x45x40", costPrice: 330, retailerPrice: 396, customerPrice: 495 },
  { srNo: "49", name: "L.B. BUSH 35x45x40", costPrice: 340, retailerPrice: 408, customerPrice: 510 },
  { srNo: "50", name: "L.B. BUSH 32x42x50", costPrice: 400, retailerPrice: 480, customerPrice: 600 },
  { srNo: "51", name: "L.B. BUSH 31.5x42x50", costPrice: 420, retailerPrice: 504, customerPrice: 630 },
  { srNo: "52", name: "L.B. BUSH 31x42x50", costPrice: 440, retailerPrice: 528, customerPrice: 660 },
  { srNo: "53", name: "L.B. BUSH 30.5x42x50", costPrice: 450, retailerPrice: 540, customerPrice: 675 },
  { srNo: "54", name: "L.B. BUSH 30x42x50", costPrice: 460, retailerPrice: 552, customerPrice: 690 },
  { srNo: "55", name: "L.B. BUSH 29.5x42x50", costPrice: 480, retailerPrice: 576, customerPrice: 720 },
  { srNo: "56", name: "L.B. BUSH 29x42x50", costPrice: 500, retailerPrice: 600, customerPrice: 750 },
  { srNo: "57", name: "L.B. BUSH 28.5x42x50", costPrice: 520, retailerPrice: 624, customerPrice: 780 },
  { srNo: "58", name: "L.B. BUSH 28x42x50", costPrice: 540, retailerPrice: 648, customerPrice: 810 },
  { srNo: "59", name: "L.B. BUSH 27.5x42x50", costPrice: 560, retailerPrice: 672, customerPrice: 840 },
  { srNo: "60", name: "L.B. BUSH 27x42x50", costPrice: 580, retailerPrice: 696, customerPrice: 870 },
  { srNo: "61", name: "L.B. BUSH 32x42x40", costPrice: 320, retailerPrice: 384, customerPrice: 480 },
  { srNo: "62", name: "L.B. BUSH 31.5x42x40", costPrice: 330, retailerPrice: 396, customerPrice: 495 },
  { srNo: "63", name: "L.B. BUSH 31x42x40", costPrice: 340, retailerPrice: 408, customerPrice: 510 },
  { srNo: "64", name: "L.B. BUSH 30.5x42x40", costPrice: 350, retailerPrice: 420, customerPrice: 525 },
  { srNo: "65", name: "L.B. BUSH 30x42x40", costPrice: 370, retailerPrice: 444, customerPrice: 555 },
  { srNo: "66", name: "L.B. BUSH 29.5x42x40", costPrice: 390, retailerPrice: 468, customerPrice: 585 },
  { srNo: "67", name: "L.B. BUSH 29x42x40", costPrice: 400, retailerPrice: 480, customerPrice: 600 },
  { srNo: "68", name: "L.B. BUSH 28.5x42x40", costPrice: 420, retailerPrice: 504, customerPrice: 630 },
  { srNo: "69", name: "L.B. BUSH 28x42x40", costPrice: 440, retailerPrice: 528, customerPrice: 660 },
  { srNo: "70", name: "L.B. BUSH 27.5x42x40", costPrice: 450, retailerPrice: 540, customerPrice: 675 },
  { srNo: "71", name: "L.B. BUSH 27x42x40", costPrice: 460, retailerPrice: 552, customerPrice: 690 },
  { srNo: "72", name: "L.B. BUSH 32x42x30", costPrice: 240, retailerPrice: 288, customerPrice: 360 },
  { srNo: "73", name: "L.B. BUSH 31.5x42x30", costPrice: 250, retailerPrice: 300, customerPrice: 375 },
  { srNo: "74", name: "L.B. BUSH 31x42x30", costPrice: 260, retailerPrice: 312, customerPrice: 390 },
  { srNo: "75", name: "L.B. BUSH 30.5x42x30", costPrice: 270, retailerPrice: 324, customerPrice: 405 },
  { srNo: "76", name: "L.B. BUSH 30x42x30", costPrice: 280, retailerPrice: 336, customerPrice: 420 },
  { srNo: "77", name: "L.B. BUSH 29.5x42x30", costPrice: 290, retailerPrice: 348, customerPrice: 435 },
  { srNo: "78", name: "L.B. BUSH 29x42x30", costPrice: 300, retailerPrice: 360, customerPrice: 450 },
  { srNo: "79", name: "L.B. BUSH 28.5x42x30", costPrice: 310, retailerPrice: 372, customerPrice: 465 },
  { srNo: "80", name: "L.B. BUSH 28x42x30", costPrice: 320, retailerPrice: 384, customerPrice: 480 },
  { srNo: "81", name: "L.B. BUSH 27.5x42x30", costPrice: 330, retailerPrice: 396, customerPrice: 495 },
  { srNo: "82", name: "L.B. BUSH 27x42x30", costPrice: 340, retailerPrice: 408, customerPrice: 510 },
  { srNo: "83", name: "L.B. BUSH 32x40x40", costPrice: 260, retailerPrice: 312, customerPrice: 390 },
  { srNo: "84", name: "L.B. BUSH 31.5x40x40", costPrice: 270, retailerPrice: 324, customerPrice: 405 },
  { srNo: "85", name: "L.B. BUSH 31x40x40", costPrice: 280, retailerPrice: 336, customerPrice: 420 },
  { srNo: "86", name: "L.B. BUSH 30.5x40x40", costPrice: 290, retailerPrice: 348, customerPrice: 435 },
  { srNo: "87", name: "L.B. BUSH 30x40x40", costPrice: 300, retailerPrice: 360, customerPrice: 450 },
  { srNo: "88", name: "L.B. BUSH 29.5x40x40", costPrice: 320, retailerPrice: 384, customerPrice: 480 },
  { srNo: "89", name: "L.B. BUSH 29x40x40", costPrice: 340, retailerPrice: 408, customerPrice: 510 },
  { srNo: "90", name: "L.B. BUSH 28.5x40x40", costPrice: 360, retailerPrice: 432, customerPrice: 540 },
  { srNo: "91", name: "L.B. BUSH 28x40x40", costPrice: 380, retailerPrice: 456, customerPrice: 570 },
  { srNo: "92", name: "L.B. BUSH 27.5x40x40", costPrice: 400, retailerPrice: 480, customerPrice: 600 },
  { srNo: "93", name: "L.B. BUSH 27x40x40", costPrice: 420, retailerPrice: 504, customerPrice: 630 },
  { srNo: "94", name: "L.B. BUSH 30x38x40", costPrice: 240, retailerPrice: 288, customerPrice: 360 },
  { srNo: "95", name: "L.B. BUSH 29.5x38x40", costPrice: 260, retailerPrice: 312, customerPrice: 390 },
  { srNo: "96", name: "L.B. BUSH 29x38x40", costPrice: 280, retailerPrice: 336, customerPrice: 420 },
  { srNo: "97", name: "L.B. BUSH 28.5x38x40", costPrice: 300, retailerPrice: 360, customerPrice: 450 },
  { srNo: "98", name: "L.B. BUSH 28x38x40", costPrice: 320, retailerPrice: 384, customerPrice: 480 },
  { srNo: "99", name: "L.B. BUSH 27.5x38x40", costPrice: 340, retailerPrice: 408, customerPrice: 510 },
  { srNo: "100", name: "L.B. BUSH 27x38x40", costPrice: 360, retailerPrice: 432, customerPrice: 540 },
  { srNo: "101", name: "L.B. BUSH 30x38x30", costPrice: 190, retailerPrice: 228, customerPrice: 285 },
  { srNo: "102", name: "L.B. BUSH 29.5x38x30", costPrice: 200, retailerPrice: 240, customerPrice: 300 },
  { srNo: "103", name: "L.B. BUSH 29x38x30", costPrice: 210, retailerPrice: 252, customerPrice: 315 },
  { srNo: "104", name: "L.B. BUSH 28.5x38x30", costPrice: 220, retailerPrice: 264, customerPrice: 330 },
  { srNo: "105", name: "L.B. BUSH 28x38x30", costPrice: 230, retailerPrice: 276, customerPrice: 345 },
  { srNo: "106", name: "L.B. BUSH 27.5x38x30", costPrice: 240, retailerPrice: 288, customerPrice: 360 },
  { srNo: "107", name: "L.B. BUSH 27x38x30", costPrice: 250, retailerPrice: 300, customerPrice: 375 },
  { srNo: "108", name: "L.B. BUSH 27x36x40", costPrice: 240, retailerPrice: 288, customerPrice: 360 },
  { srNo: "109", name: "L.B. BUSH 26.5x36x40", costPrice: 255, retailerPrice: 306, customerPrice: 382.5 },
  { srNo: "110", name: "L.B. BUSH 26x36x40", costPrice: 270, retailerPrice: 324, customerPrice: 405 },
  { srNo: "111", name: "L.B. BUSH 25.5x36x40", costPrice: 285, retailerPrice: 342, customerPrice: 427.5 },
  { srNo: "112", name: "L.B. BUSH 25x36x40", costPrice: 300, retailerPrice: 360, customerPrice: 450 },
  { srNo: "113", name: "L.B. BUSH 24.5x36x40", costPrice: 315, retailerPrice: 378, customerPrice: 472.5 },
  { srNo: "114", name: "L.B. BUSH 24x36x40", costPrice: 330, retailerPrice: 396, customerPrice: 495 },
  { srNo: "115", name: "L.B. BUSH 30x36x24", costPrice: 120, retailerPrice: 144, customerPrice: 180 },
  { srNo: "116", name: "L.B. BUSH 29.5x36x24", costPrice: 130, retailerPrice: 156, customerPrice: 195 },
  { srNo: "117", name: "L.B. BUSH 29x36x24", costPrice: 140, retailerPrice: 168, customerPrice: 210 },
  { srNo: "118", name: "L.B. BUSH 28.5x36x24", costPrice: 145, retailerPrice: 174, customerPrice: 217.5 },
  { srNo: "119", name: "L.B. BUSH 28x36x24", costPrice: 150, retailerPrice: 180, customerPrice: 225 },
  { srNo: "120", name: "L.B. BUSH 27.5x36x24", costPrice: 160, retailerPrice: 192, customerPrice: 240 },
  { srNo: "121", name: "L.B. BUSH 27x36x24", costPrice: 165, retailerPrice: 198, customerPrice: 247.5 },
  { srNo: "122", name: "L.B. BUSH 26.5x36x24", costPrice: 165, retailerPrice: 198, customerPrice: 247.5 },
  { srNo: "123", name: "L.B. BUSH 26x36x24", costPrice: 170, retailerPrice: 204, customerPrice: 255 },
  { srNo: "124", name: "L.B. BUSH 25.5x36x24", costPrice: 180, retailerPrice: 216, customerPrice: 270 },
  { srNo: "125", name: "L.B. BUSH 25x36x24", costPrice: 190, retailerPrice: 228, customerPrice: 285 },
  { srNo: "126", name: "L.B. BUSH 24.5x36x24", costPrice: 200, retailerPrice: 240, customerPrice: 300 },
  { srNo: "127", name: "L.B. BUSH 24x36x24", costPrice: 210, retailerPrice: 252, customerPrice: 315 },
  { srNo: "128", name: "L.B. BUSH 23.5x36x24", costPrice: 220, retailerPrice: 264, customerPrice: 330 },
  { srNo: "129", name: "L.B. BUSH 23x36x24", costPrice: 230, retailerPrice: 276, customerPrice: 345 },
  { srNo: "130", name: "L.B. BUSH 25x36x20", costPrice: 160, retailerPrice: 192, customerPrice: 240 },
  { srNo: "131", name: "L.B. BUSH 26.5x32x40", costPrice: 170, retailerPrice: 204, customerPrice: 255 },
  { srNo: "132", name: "L.B. BUSH 26x32x40", costPrice: 180, retailerPrice: 216, customerPrice: 270 },
  { srNo: "133", name: "L.B. BUSH 25.5x32x40", costPrice: 190, retailerPrice: 228, customerPrice: 285 },
  { srNo: "134", name: "L.B. BUSH 25x32x40", costPrice: 210, retailerPrice: 252, customerPrice: 315 },
  { srNo: "135", name: "L.B. BUSH 24.5x32x40", costPrice: 230, retailerPrice: 276, customerPrice: 345 },
  { srNo: "136", name: "L.B. BUSH 24x32x40", costPrice: 250, retailerPrice: 300, customerPrice: 375 },
  { srNo: "137", name: "L.B. BUSH 23.5x32x40", costPrice: 260, retailerPrice: 312, customerPrice: 390 },
  { srNo: "138", name: "L.B. BUSH 23x32x40", costPrice: 280, retailerPrice: 336, customerPrice: 420 },
  { srNo: "139", name: "L.B. BUSH 27x32x24", costPrice: 96, retailerPrice: 115.2, customerPrice: 144 },
  { srNo: "140", name: "L.B. BUSH 26.5x32x24", costPrice: 100, retailerPrice: 120, customerPrice: 150 },
  { srNo: "141", name: "L.B. BUSH 26x32x24", costPrice: 105, retailerPrice: 126, customerPrice: 157.5 },
  { srNo: "142", name: "L.B. BUSH 25.5x32x24", costPrice: 110, retailerPrice: 132, customerPrice: 165 },
  { srNo: "143", name: "L.B. BUSH 25x32x24", costPrice: 115, retailerPrice: 138, customerPrice: 172.5 },
  { srNo: "144", name: "L.B. BUSH 24.5x32x24", costPrice: 120, retailerPrice: 144, customerPrice: 180 },
  { srNo: "145", name: "L.B. BUSH 24x32x24", costPrice: 125, retailerPrice: 150, customerPrice: 187.5 },
  { srNo: "146", name: "L.B. BUSH 23.5x32x24", costPrice: 130, retailerPrice: 156, customerPrice: 195 },
  { srNo: "147", name: "L.B. BUSH 23x32x24", costPrice: 140, retailerPrice: 168, customerPrice: 210 },
  { srNo: "148", name: "L.B. BUSH 22.5x32x24", costPrice: 150, retailerPrice: 180, customerPrice: 225 },
  { srNo: "149", name: "L.B. BUSH 21x30x18", costPrice: 96, retailerPrice: 115.2, customerPrice: 144 },
  { srNo: "150", name: "L.B. BUSH 20.5x30x18", costPrice: 104, retailerPrice: 124.8, customerPrice: 156 },
  { srNo: "151", name: "L.B. BUSH 20x30x18", costPrice: 110, retailerPrice: 132, customerPrice: 165 },
  { srNo: "152", name: "L.B. BUSH 19.5x30x18", costPrice: 116, retailerPrice: 139.2, customerPrice: 174 },
  { srNo: "153", name: "L.B. BUSH 19x30x18", costPrice: 122, retailerPrice: 146.4, customerPrice: 183 },
  { srNo: "154", name: "L.B. BUSH 18.5x30x18", costPrice: 128, retailerPrice: 153.6, customerPrice: 192 },
  { srNo: "155", name: "L.B. BUSH 18x30x18", costPrice: 132, retailerPrice: 158.4, customerPrice: 198 },
  { srNo: "156", name: "L.B. BUSH 18x28x30", costPrice: 160, retailerPrice: 192, customerPrice: 240 },
  { srNo: "157", name: "L.B. BUSH 17.5x28x30", costPrice: 170, retailerPrice: 204, customerPrice: 255 },
  { srNo: "158", name: "L.B. BUSH 17x28x30", costPrice: 180, retailerPrice: 216, customerPrice: 270 },
  { srNo: "159", name: "L.B. BUSH 21x28x18", costPrice: 90, retailerPrice: 108, customerPrice: 135 },
  { srNo: "160", name: "L.B. BUSH 20.5x28x18", costPrice: 96, retailerPrice: 115.2, customerPrice: 144 },
  { srNo: "161", name: "L.B. BUSH 20x28x18", costPrice: 104, retailerPrice: 124.8, customerPrice: 156 },
  { srNo: "162", name: "L.B. BUSH 19.5x28x18", costPrice: 110, retailerPrice: 132, customerPrice: 165 },
  { srNo: "163", name: "L.B. BUSH 19x28x18", costPrice: 116, retailerPrice: 139.2, customerPrice: 174 },
  { srNo: "164", name: "L.B. BUSH 18.5x28x18", costPrice: 122, retailerPrice: 146.4, customerPrice: 183 },
  { srNo: "165", name: "L.B. BUSH 18x28x18", costPrice: 128, retailerPrice: 153.6, customerPrice: 192 },
  { srNo: "166", name: "L.B. BUSH 18x25x25", costPrice: 96, retailerPrice: 115.2, customerPrice: 144 },
  { srNo: "167", name: "L.B. BUSH 17.5x25x25", costPrice: 110, retailerPrice: 132, customerPrice: 165 },
  { srNo: "168", name: "L.B. BUSH 17x25x25", costPrice: 120, retailerPrice: 144, customerPrice: 180 },
  { srNo: "169", name: "L.B. BUSH 18x25x15", costPrice: 70, retailerPrice: 84, customerPrice: 105 }
];

// Rubber Bush - Raj & Raj (16 items, Sr 1 to 16)
const rajRajRubberItems = [
  { srNo: "1", name: "Raj & Raj Rubber Bush 15x25x15 to 20x25x15", costPrice: 32, retailerPrice: 38.4, customerPrice: 48 },
  { srNo: "2", name: "Raj & Raj Rubber Bush 18x27x20 to 20x27x20", costPrice: 34, retailerPrice: 40.8, customerPrice: 51 },
  { srNo: "3", name: "Raj & Raj Rubber Bush 18x28x20 to 21x28x18", costPrice: 32, retailerPrice: 38.4, customerPrice: 48 },
  { srNo: "4", name: "Raj & Raj Rubber Bush 18x30x20 to 22x30x20", costPrice: 34, retailerPrice: 40.8, customerPrice: 51 },
  { srNo: "5", name: "Raj & Raj Rubber Bush 18x32x24 to 25x32x24", costPrice: 40, retailerPrice: 48, customerPrice: 60 },
  { srNo: "6", name: "Raj & Raj Rubber Bush 21x36x24 to 24x36x24", costPrice: 44, retailerPrice: 52.8, customerPrice: 66 },
  { srNo: "7", name: "Raj & Raj Rubber Bush 25x36x24 to 28x36x24", costPrice: 40, retailerPrice: 48, customerPrice: 60 },
  { srNo: "8", name: "Raj & Raj Rubber Bush 25x36x15 to 28x36x15", costPrice: 32, retailerPrice: 38.4, customerPrice: 48 },
  { srNo: "9", name: "Raj & Raj Rubber Bush 25x38x24 to 28x38x24", costPrice: 50, retailerPrice: 60, customerPrice: 75 },
  { srNo: "10", name: "Raj & Raj Rubber Bush 25x38x30 to 28x38x30", costPrice: 55, retailerPrice: 66, customerPrice: 82.5 },
  { srNo: "11", name: "Raj & Raj Rubber Bush 26x40x25 to 30x40x25", costPrice: 55, retailerPrice: 66, customerPrice: 82.5 },
  { srNo: "12", name: "Raj & Raj Rubber Bush 27x42x30 to 32x42x30", costPrice: 60, retailerPrice: 72, customerPrice: 90 },
  { srNo: "13", name: "Raj & Raj Rubber Bush 27x27x20", costPrice: 40, retailerPrice: 48, customerPrice: 60 },
  { srNo: "14", name: "Raj & Raj Rubber Bush 32x45x35 to 35x45x35", costPrice: 72, retailerPrice: 86.4, customerPrice: 108 },
  { srNo: "15", name: "Raj & Raj Rubber Bush 35x48x40 to 38x48x40", costPrice: 80, retailerPrice: 96, customerPrice: 120 },
  { srNo: "16", name: "Raj & Raj Rubber Bush 33x50x40 to 38x50x40", costPrice: 80, retailerPrice: 96, customerPrice: 120 }
];

// Rubber Bush - Tefcot (8 items, Sr 1 to 8)
const tefcotRubberItems = [
  { srNo: "1", name: "Tefcot Rubber Bush 18 x 28 x 18", costPrice: 90, retailerPrice: 108, customerPrice: 135 },
  { srNo: "2", name: "Tefcot Rubber Bush 21 x 30 x 18", costPrice: 90, retailerPrice: 108, customerPrice: 135 },
  { srNo: "3", name: "Tefcot Rubber Bush 24 to 28 x 36 x 24", costPrice: 56, retailerPrice: 67.2, customerPrice: 84 },
  { srNo: "4", name: "Tefcot Rubber Bush 27 x 42 x 20CL", costPrice: 120, retailerPrice: 144, customerPrice: 180 },
  { srNo: "5", name: "Tefcot Rubber Bush 27 to 30 x 42 x 30", costPrice: 150, retailerPrice: 180, customerPrice: 225 },
  { srNo: "6", name: "Tefcot Rubber Bush 32 to 37 x 45 x 35", costPrice: 190, retailerPrice: 228, customerPrice: 285 },
  { srNo: "7", name: "Tefcot Rubber Bush 35 to 38 x 48 x 40", costPrice: 220, retailerPrice: 264, customerPrice: 330 },
  { srNo: "8", name: "Tefcot Rubber Bush 35 to 38 x 50 x 40", costPrice: 220, retailerPrice: 264, customerPrice: 330 }
];

// Rubber Bush - Dura (8 items, Sr 1 to 8)
const duraRubberItems = [
  { srNo: "1", name: "Dura Rubber Bush 18 x 25 x 15", costPrice: 46, retailerPrice: 55.2, customerPrice: 69 },
  { srNo: "2", name: "Dura Rubber Bush 18 to 21 x 28 x 18", costPrice: 46, retailerPrice: 55.2, customerPrice: 69 },
  { srNo: "3", name: "Dura Rubber Bush 18 to 21 x 30 x 18", costPrice: 46, retailerPrice: 55.2, customerPrice: 69 },
  { srNo: "4", name: "Dura Rubber Bush 24 to 28 x 36 x 15", costPrice: 50, retailerPrice: 60, customerPrice: 75 },
  { srNo: "5", name: "Dura Rubber Bush 24 to 28 x 36 x 24", costPrice: 60, retailerPrice: 72, customerPrice: 90 },
  { srNo: "6", name: "Dura Rubber Bush 27 x 42 x 20", costPrice: 60, retailerPrice: 72, customerPrice: 90 },
  { srNo: "7", name: "Dura Rubber Bush 27 to 30 x 42 x 30", costPrice: 80, retailerPrice: 96, customerPrice: 120 },
  { srNo: "8", name: "Dura Rubber Bush 36 to 38 x 50 x 40", costPrice: 120, retailerPrice: 144, customerPrice: 180 }
];

async function main() {
  console.log('--- Starting Exact PDF Data & 3-Level Category Sync ---');

  // Ensure J.K. Spares Brand exists
  await prisma.brand.upsert({
    where: { name: 'J.K. Spares' },
    update: {},
    create: { name: 'J.K. Spares' }
  });

  // 1. Setup Parent Category: "L.B. Bush & Rubber Bush"
  let mainBushCat = await prisma.category.findFirst({
    where: {
      OR: [
        { name: 'L.B. Bush & Rubber Bush' },
        { name: 'L.B. Bush, Rubber Bush' },
        { name: 'L.B. Bush & Rubber Bush Spares' }
      ]
    }
  });

  if (!mainBushCat) {
    mainBushCat = await prisma.category.create({
      data: { name: 'L.B. Bush & Rubber Bush' }
    });
  } else if (mainBushCat.name !== 'L.B. Bush & Rubber Bush') {
    mainBushCat = await prisma.category.update({
      where: { id: mainBushCat.id },
      data: { name: 'L.B. Bush & Rubber Bush' }
    });
  }

  // 2. Setup Subcategory: "L.B. Bush" under "L.B. Bush & Rubber Bush"
  let lbBushCat = await prisma.category.findFirst({
    where: { name: 'L.B. Bush', parentId: mainBushCat.id }
  });
  if (!lbBushCat) {
    const existing = await prisma.category.findFirst({ where: { name: 'L.B. Bush' } });
    if (existing) {
      lbBushCat = await prisma.category.update({
        where: { id: existing.id },
        data: { parentId: mainBushCat.id }
      });
    } else {
      lbBushCat = await prisma.category.create({
        data: { name: 'L.B. Bush', parentId: mainBushCat.id }
      });
    }
  }

  // 3. Setup Subcategory: "Rubber Bush" under "L.B. Bush & Rubber Bush"
  let rubberBushCat = await prisma.category.findFirst({
    where: { name: 'Rubber Bush', parentId: mainBushCat.id }
  });
  if (!rubberBushCat) {
    const existing = await prisma.category.findFirst({ where: { name: 'Rubber Bush' } });
    if (existing) {
      rubberBushCat = await prisma.category.update({
        where: { id: existing.id },
        data: { parentId: mainBushCat.id }
      });
    } else {
      rubberBushCat = await prisma.category.create({
        data: { name: 'Rubber Bush', parentId: mainBushCat.id }
      });
    }
  }

  // 4. Setup 3 Sub-subcategories under "Rubber Bush":
  async function getOrCreateSubSub(name: string, parentId: string) {
    let cat = await prisma.category.findFirst({ where: { name, parentId } });
    if (!cat) {
      const existing = await prisma.category.findFirst({ where: { name } });
      if (existing) {
        cat = await prisma.category.update({
          where: { id: existing.id },
          data: { parentId }
        });
      } else {
        cat = await prisma.category.create({
          data: { name, parentId }
        });
      }
    }
    return cat;
  }

  const rajRajCat = await getOrCreateSubSub('Raj & Raj Rubber', rubberBushCat.id);
  const tefcotCat = await getOrCreateSubSub('Tefcot Rubber', rubberBushCat.id);
  const duraCat = await getOrCreateSubSub('Dura Rubber', rubberBushCat.id);

  console.log('Categories configured:');
  console.log(`- ${mainBushCat.name} (id: ${mainBushCat.id})`);
  console.log(`  - ${lbBushCat.name} (id: ${lbBushCat.id})`);
  console.log(`  - ${rubberBushCat.name} (id: ${rubberBushCat.id})`);
  console.log(`    - ${rajRajCat.name} (id: ${rajRajCat.id})`);
  console.log(`    - ${tefcotCat.name} (id: ${tefcotCat.id})`);
  console.log(`    - ${duraCat.name} (id: ${duraCat.id})`);

  // Clean old bush items in lbBushCat and rubber categories to replace with exact 169 & 32 items
  console.log('Cleaning old Bush items...');
  await prisma.item.deleteMany({
    where: {
      categoryId: {
        in: [lbBushCat.id, rubberBushCat.id, rajRajCat.id, tefcotCat.id, duraCat.id]
      }
    }
  });

  async function batchInsertItems(items: Array<{ srNo: string; name: string; costPrice: number; retailerPrice: number; customerPrice: number }>, catId: string) {
    const CHUNK_SIZE = 35;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(item =>
          prisma.item.create({
            data: {
              name: item.name,
              srNo: item.srNo,
              brand: 'J.K. Spares',
              costPrice: item.costPrice,
              retailerPrice: item.retailerPrice,
              customerPrice: item.customerPrice,
              unit: 'Pcs',
              categoryId: catId
            }
          })
        )
      );
    }
  }

  // Batch insert 169 L.B. Bush items
  console.log(`Inserting ${lbBushItems.length} L.B. Bush items...`);
  await batchInsertItems(lbBushItems, lbBushCat.id);

  // Insert 16 Raj & Raj Rubber items
  console.log(`Inserting ${rajRajRubberItems.length} Raj & Raj Rubber items...`);
  await batchInsertItems(rajRajRubberItems, rajRajCat.id);

  // Insert 8 Tefcot Rubber items
  console.log(`Inserting ${tefcotRubberItems.length} Tefcot Rubber items...`);
  await batchInsertItems(tefcotRubberItems, tefcotCat.id);

  // Insert 8 Dura Rubber items
  console.log(`Inserting ${duraRubberItems.length} Dura Rubber items...`);
  await batchInsertItems(duraRubberItems, duraCat.id);

  console.log('✅ Bush items & 3-level Rubber Bush categories successfully migrated!');
}

main()
  .catch(e => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
