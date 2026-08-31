window.DALIAN_TRIP = {
  city: '大连',
  origin: { id: 'stay', name: '东港绿地中心民宿', query: '大连东港绿地中心', type: 'stay', note: '民宿位于东港绿地中心；出发前如拿到具体楼栋/门牌，可在高德中再核对一次。' },
  days: {
    d1: {
      label: 'Day 1', title: '中山日料 · 咖啡商超 · 东港夜景', color: '#ee624e',
      stops: [
        { id: 'stay-in', ref: 'stay', time: '13:10', label: '东港绿地中心民宿 · 放行李', kind: 'stay', info: '机场到东港约 45–60 分钟，先放行李再进中山。' },
        { id: 'aoshen', name: '澳深鱼市·祝庆街店', query: '澳深鱼市 祝庆街店 大连', time: '14:10', kind: 'food', label: '午饭 · 澳深鱼市', budget: '人均约 ¥127', info: '按你确认的鱼市午饭安排；高德门店为竹青街 2-3 号，孩子以熟食、白饭为主。', fallback: '排队超 30 分钟改久時。' },
        { id: 'russian', name: '俄罗斯风情街', query: '大连俄罗斯风情街', time: '15:35', kind: 'sight', label: 'City Walk · 俄罗斯风情街', info: '按你确认坐标展示；轻松看建筑、拍照即可。' },
        { id: 'dive', name: 'DIVE COFFEE扎猛咖啡馆', query: 'Dive Coffee 大连', time: '16:10', kind: 'coffee', label: '咖啡 · Dive Coffee', info: '俄风街向南步行约 15 分钟；作为中山 City Walk 的中途休息。' },
        { id: 'dalianmall', name: '大连商场', query: '大连商场', time: '16:45', kind: 'shopping', label: 'City Walk · 大连商场', info: '青三街 1 号；看老商场与青泥洼桥街区，顺便补给。' },
        { id: 'zhongshan', name: '中山广场', query: '中山广场 大连', time: '17:20', kind: 'sight', label: 'City Walk · 中山广场', info: '从大连商场步行至中山广场，慢走看近代建筑与放射状街道。' },
        { id: 'stay-back', ref: 'stay', time: '18:00', label: '回绿地中心民宿 · 缓冲', kind: 'stay', info: '打车回民宿休息、换衣服；如计划民宿做一顿饭，再顺路买菜。' },
        { id: 'zhenghuangqi', name: '正黄旗海鲜烧烤·东港店', query: '正黄旗海鲜烧烤 东港店 大连', time: '19:00', kind: 'food', label: '晚饭 · 正黄旗', budget: '人均约 ¥160', info: '海肠捞饭或海胆二选一，加烤贝类和熟食；别与午饭重复刺身。' },
        { id: 'watercity', name: '东方水城运河', query: '东方水城 大连', time: '20:30', kind: 'sight', label: '夜景 · 东方水城', info: '晚饭后再来散步、拍照；20:00 后灯光氛围更好。' },
        { id: 'boardwalk', name: '东港木栈道', query: '东港木栈道 大连', time: '21:20', kind: 'sight', label: '夜景 · 东港木栈道', info: '水城后沿东港散步；饭后有精神再走，成人夜宵与它二选一。' }
      ],
      candidates: [
        { name: '杉木日本料理·港湾广场店', query: '杉木日本料理 港湾广场 大连', kind: 'food', reason: '想吃日料时替换澳深午饭' },
        { name: '久時·生鱼饭·咖喱', query: '久時 生鱼饭 咖喱 大连', kind: 'food', reason: '澳深排队时的午饭替换' },
        { name: '喜鼎海胆水饺·东港店', query: '喜鼎海胆水饺 东港店 大连', kind: 'food', reason: '孩子可吃水饺；建议先取号' },
        { name: '桃源市场', query: '桃源市场 大连', kind: 'market', reason: '只在决定民宿做一顿饭时补水果、酸奶、食材' },
        { name: '凯丹广场', query: '凯丹广场 大连', kind: 'market', reason: '累了或下雨时的室内短停' },
        { name: '东北灵丹', query: '东北灵丹 大连', kind: 'coffee', reason: '若想专程去南山路，替换 Dive；不要两家都去' }
      ]
    },
    d2: {
      label: 'Day 2', title: '动物园索道 · 自然博物馆 · 星海喂海鸥', color: '#1976d2',
      stops: [
        { id: 'stay-start', ref: 'stay', time: '08:45', label: '东港出发', kind: 'stay', info: '打车到森林动物园南侧，上午留足索道排队与带娃缓冲。' },
        { id: 'deer', name: '森林动物园·梅花鹿', query: '大连森林动物园梅花鹿', time: '09:30', kind: 'sight', label: '动物园 · 遇见梅花鹿', info: '从南侧进山，先慢走找梅花鹿；只喂景区允许的食物，孩子靠近时由成人看护。' },
        { id: 'cableway', name: '大连海达索道', query: '大连森林动物园海达索道', time: '10:15', kind: 'sight', label: '动物园 · 海达索道', info: '看海与跨海大桥；大风、暴雨或雷电可能临停，现场确认后再购票。' },
        { id: 'riyuesheng', name: '日月昇·星海公园店', query: '日月昇 星海公园店 大连', time: '12:30', kind: 'food', label: '午饭 · 日月昇', budget: '人均约 ¥97', info: '海肠捞饭或海胆相关菜只选一项，配焖子/蔬菜。' },
        { id: 'natural', name: '大连自然博物馆', query: '大连自然博物馆', time: '14:00', kind: 'sight', label: '自然博物馆', info: '只看恐龙、鲸类、海洋动物三部分；16:00 左右离馆，别塞太满。' },
        { id: 'xinghai', name: '星海广场', query: '星海广场 大连', time: '16:20', kind: 'sight', label: '星海广场 · 喂海鸥', info: '以当日海鸥情况为准；看海、玩沙、遛娃，注意防风与海边安全。' },
        { id: 'yingmu', name: '樱木千鹤·星海店', query: '樱木千鹤 星海店 大连', time: '18:30', kind: 'food', label: '晚饭 · 樱木千鹤', budget: '人均约 ¥327', info: '海胆饭 ¥299 或海鲜饭 ¥199 二选一；提前订位。' }
      ],
      candidates: [
        { name: '牟传仁·星海新天地店', query: '牟传仁 星海新天地店 大连', kind: 'food', reason: '饺子、豆腐、热菜更适合孩子' },
        { name: '杉木日本料理·港湾广场店', query: '杉木日本料理 港湾广场 大连', kind: 'food', reason: '与樱木二选一，不叠加' },
        { name: 'Carrot Coffee', query: 'Carrot Coffee 大连', kind: 'coffee', reason: '按当天最近门店决定，与 Dive 二选一' },
        { name: '大连博物馆', query: '大连博物馆', kind: 'market', reason: '雨天替代莲花山部分行程' }
      ]
    },
    d3: {
      label: 'Day 3', title: '自由活动 · 退房收尾', color: '#8557c8',
      stops: [
        { id: 'stay-checkout', ref: 'stay', time: '09:00', label: '自由活动 / 退房收尾', kind: 'stay', info: '睡到自然醒，按民宿退房、带娃状态与返程时间灵活安排；今天不绑定固定点位和路线。' }
      ],
      candidates: [
        { name: '凯丹广场', query: '凯丹广场 大连', kind: 'market', reason: '下雨或带娃需要室内短停时再去' },
        { name: '阿水的生鱼饭旗舰店', query: '阿水的生鱼饭旗舰店 大连', kind: 'food', reason: '仅大人特别想再吃生鱼饭时选择' }
      ]
    }
  }
};
