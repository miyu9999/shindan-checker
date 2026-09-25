// 診断チェッカー v2: 業種別の業務リスト
// 元データ: ../task-lists/*.md （mdを正とし、変更はまずmdに反映してからここに書き写す）
// tag: 定型 / 調整 / 判断 / 対人 / 身体
// category.roles / task.roles を省略した場合は全ロール共通
// task.roles は category.roles のサブセットとして指定する

const COMMON_CATEGORY = {
  name: "共通（どの仕事にもある業務）",
  tasks: [
    { name: "上司とのやり取り・報告", tag: "調整" },
    { name: "上司・同僚との人間関係", tag: "対人" },
    { name: "会議・打ち合わせ", tag: "調整" },
    { name: "メール・チャットの対応", tag: "調整" },
    { name: "研修・勉強会", tag: "判断" },
    { name: "勤怠・経費などの社内手続き", tag: "定型" },
  ],
};

const INDUSTRIES = [
  {
    id: "doctor",
    name: "医師",
    beta: true,
    roles: [
      { id: "resident", name: "研修医" },
      { id: "attending", name: "勤務医" },
      { id: "manager", name: "管理職" },
    ],
    categories: [
      {
        name: "病棟（研修医）", roles: ["resident"],
        tasks: [
          { name: "担当患者の情報収集（回診前のチェック）", tag: "定型" },
          { name: "回診", tag: "判断" },
          { name: "診察", tag: "判断" },
          { name: "オーダー入力（検査・処方・点滴）", tag: "定型" },
          { name: "看護師からの問い合わせ・指示出し", tag: "調整" },
          { name: "手技（採血・ルート確保など）", tag: "判断" },
          { name: "他科へのコンサルト依頼", tag: "調整" },
        ],
      },
      {
        name: "書類・記録（研修医）", roles: ["resident"],
        tasks: [
          { name: "カルテ記載", tag: "定型" },
          { name: "入院時・退院時サマリー", tag: "定型" },
          { name: "紹介状・返書", tag: "定型" },
          { name: "診断書などの書類", tag: "定型" },
          { name: "研修評価システム（EPOC2など）への入力", tag: "定型" },
        ],
      },
      {
        name: "カンファレンス・学習（研修医）", roles: ["resident"],
        tasks: [
          { name: "カンファレンス用の資料作り", tag: "定型" },
          { name: "症例発表・学会の準備", tag: "判断" },
          { name: "勉強・文献検索", tag: "判断" },
          { name: "勉強会・研修会", tag: "判断" },
        ],
      },
      {
        name: "上級医とのやり取り（研修医）", roles: ["resident"],
        tasks: [
          { name: "上級医への報告・相談", tag: "調整" },
          { name: "上級医の予定に合わせた待機", tag: "調整" },
        ],
      },
      {
        name: "救急・当直（研修医）", roles: ["resident"],
        tasks: [
          { name: "救急外来の対応", tag: "判断" },
          { name: "当直中のコール対応", tag: "調整" },
        ],
      },
      {
        name: "患者・家族（研修医）", roles: ["resident"],
        tasks: [
          { name: "病状説明・ICへの同席", tag: "対人" },
          { name: "患者・家族への対応", tag: "対人" },
        ],
      },
      {
        name: "診療（勤務医）", roles: ["attending"],
        tasks: [
          { name: "外来診察", tag: "判断" },
          { name: "病棟回診・診察", tag: "判断" },
          { name: "手術・処置", tag: "判断" },
          { name: "検査結果の確認・判断", tag: "判断" },
          { name: "オーダー入力（検査・処方・点滴）", tag: "定型" },
          { name: "緊急対応・急変対応", tag: "判断" },
        ],
      },
      {
        name: "記録・書類（勤務医）", roles: ["attending"],
        tasks: [
          { name: "カルテ記載", tag: "定型" },
          { name: "紹介状・返書の作成", tag: "定型" },
          { name: "診断書・意見書の作成", tag: "定型" },
          { name: "退院サマリーの作成", tag: "定型" },
          { name: "保険会社・行政向け書類", tag: "定型" },
        ],
      },
      {
        name: "連携・指導（勤務医）", roles: ["attending"],
        tasks: [
          { name: "他科へのコンサルト対応", tag: "調整" },
          { name: "研修医・後輩医師の指導", tag: "判断" },
          { name: "看護師・コメディカルとの連携", tag: "調整" },
          { name: "カンファレンス・症例検討会", tag: "判断" },
        ],
      },
      {
        name: "患者・家族（勤務医）", roles: ["attending"],
        tasks: [
          { name: "病状説明・インフォームドコンセント", tag: "対人" },
          { name: "患者・家族からの相談対応", tag: "対人" },
          { name: "クレーム・苦情対応", tag: "対人" },
        ],
      },
      {
        name: "学術・当直（勤務医）", roles: ["attending"],
        tasks: [
          { name: "学会発表・論文執筆", tag: "判断" },
          { name: "当直・オンコール対応", tag: "調整" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "診療科の人員配置・シフト作成", tag: "調整" },
          { name: "若手医師の評価・面談", tag: "対人" },
          { name: "診療報酬・病院経営に関わる会議", tag: "調整" },
          { name: "医療安全・院内委員会の運営", tag: "調整" },
        ],
      },
    ],
  },
  {
    id: "nurse",
    name: "看護師",
    beta: true,
    roles: [
      { id: "staff", name: "スタッフ" },
      { id: "manager", name: "管理職（師長・リーダー）" },
    ],
    categories: [
      {
        name: "情報収集・申し送り",
        tasks: [
          { name: "勤務前の情報収集（カルテ確認）", tag: "定型" },
          { name: "申し送り", tag: "定型" },
        ],
      },
      {
        name: "観察・処置",
        tasks: [
          { name: "バイタル測定・観察", tag: "定型" },
          { name: "与薬・点滴の準備と管理", tag: "判断" },
          { name: "医師の指示受け・確認", tag: "調整" },
          { name: "検査・手術への送り出しと迎え", tag: "調整" },
          { name: "ナースコール対応", tag: "調整" },
          { name: "夜勤帯の巡視", tag: "定型" },
        ],
      },
      {
        name: "日常生活の援助",
        tasks: [
          { name: "清潔ケア（清拭・洗髪など）", tag: "身体" },
          { name: "食事介助", tag: "身体" },
          { name: "排泄介助", tag: "身体" },
          { name: "移乗・移送・体位変換", tag: "身体" },
        ],
      },
      {
        name: "記録",
        tasks: [
          { name: "看護記録", tag: "定型" },
          { name: "温度板・チェックリストの入力", tag: "定型" },
          { name: "看護計画の立案・評価", tag: "判断" },
          { name: "インシデントレポート", tag: "定型" },
        ],
      },
      {
        name: "患者・家族・退院",
        tasks: [
          { name: "患者の訴えや不安への対応", tag: "対人" },
          { name: "家族への対応・説明", tag: "対人" },
          { name: "退院指導", tag: "判断" },
          { name: "退院調整（MSW・ケアマネとの連絡）", tag: "調整" },
        ],
      },
      {
        name: "病棟運営",
        tasks: [
          { name: "物品・薬剤の補充と管理", tag: "定型" },
          { name: "入院・転棟の受け入れ準備", tag: "調整" },
          { name: "多職種カンファレンス", tag: "調整" },
          { name: "新人・学生の指導", tag: "判断" },
          { name: "委員会・院内研修", tag: "調整" },
          { name: "ベッドコントロール", tag: "調整", roles: ["manager"] },
          { name: "勤務表の作成", tag: "調整", roles: ["manager"] },
        ],
      },
    ],
  },
  {
    id: "teacher",
    name: "教員・講師",
    beta: true,
    roles: [
      { id: "school", name: "学校教員" },
      { id: "juku", name: "塾講師" },
      { id: "manager", name: "管理職" },
    ],
    categories: [
      {
        name: "特訓・指導（塾講師）", roles: ["juku"],
        tasks: [
          { name: "確認テストの準備・印刷", tag: "定型" },
          { name: "確認テストの採点", tag: "定型" },
          { name: "口頭チェック（解き方を説明させる）", tag: "判断" },
          { name: "次回までの宿題範囲の設定", tag: "判断" },
          { name: "参考書ルートの進捗管理・見直し", tag: "判断" },
          { name: "宿題をやってこなかった生徒への対応", tag: "対人" },
          { name: "質問対応", tag: "判断" },
          { name: "モチベーションが落ちた生徒への声かけ", tag: "対人" },
        ],
      },
      {
        name: "記録・引き継ぎ（塾講師）", roles: ["juku"],
        tasks: [
          { name: "特訓記録・カルテ記入", tag: "定型" },
          { name: "他講師への引き継ぎ", tag: "定型" },
          { name: "教室長への報告", tag: "調整" },
        ],
      },
      {
        name: "自習・日常の管理（塾講師）", roles: ["juku"],
        tasks: [
          { name: "自習室の巡回・監督", tag: "定型" },
          { name: "生徒からの学習報告・連絡への返信", tag: "定型" },
          { name: "欠席・遅刻連絡の対応", tag: "調整" },
          { name: "振替の日程調整", tag: "調整" },
        ],
      },
      {
        name: "保護者・進路（塾講師）", roles: ["juku"],
        tasks: [
          { name: "保護者面談", tag: "対人" },
          { name: "保護者への連絡・報告書", tag: "定型" },
          { name: "進路・志望校の相談", tag: "判断" },
        ],
      },
      {
        name: "運営・事務（塾講師）", roles: ["juku"],
        tasks: [
          { name: "シフトの提出", tag: "調整" },
          { name: "講師ミーティング・研修への参加", tag: "調整" },
          { name: "模試・成績の入力と管理", tag: "定型" },
          { name: "教室の片付け・清掃", tag: "定型" },
          { name: "勤怠記録・授業外の作業の申告", tag: "定型" },
        ],
      },
      {
        name: "授業（学校教員）", roles: ["school"],
        tasks: [
          { name: "授業準備・教材研究", tag: "判断" },
          { name: "板書・プリント作成", tag: "定型" },
          { name: "授業の実施", tag: "判断" },
          { name: "採点・添削", tag: "定型" },
          { name: "小テスト・定期テストの作成", tag: "判断" },
          { name: "成績処理・通知表の作成", tag: "定型" },
        ],
      },
      {
        name: "生徒対応（学校教員）", roles: ["school"],
        tasks: [
          { name: "生徒指導（トラブル対応）", tag: "対人" },
          { name: "生徒からの相談対応", tag: "対人" },
          { name: "進路指導・面談", tag: "判断" },
          { name: "欠席・遅刻への対応", tag: "調整" },
        ],
      },
      {
        name: "学級・校務（学校教員）", roles: ["school"],
        tasks: [
          { name: "学級事務（出欠・連絡帳など）", tag: "定型" },
          { name: "学級だより・配布物の作成", tag: "定型" },
          { name: "校務分掌（委員会・行事の担当）", tag: "調整" },
          { name: "部活動・クラブ活動の指導", tag: "対人" },
          { name: "職員会議・学年会議", tag: "調整" },
        ],
      },
      {
        name: "保護者対応（学校教員）", roles: ["school"],
        tasks: [
          { name: "保護者面談", tag: "対人" },
          { name: "保護者からの連絡・クレーム対応", tag: "対人" },
          { name: "連絡帳・電話での連絡", tag: "定型" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "シフトの作成・調整", tag: "調整" },
          { name: "無料受験相談・入塾面談", tag: "対人" },
          { name: "講師の採用・研修", tag: "判断" },
          { name: "参考書の発注・在庫管理", tag: "定型" },
          { name: "月謝・請求の事務", tag: "定型" },
          { name: "集客（SNS・チラシ）", tag: "判断" },
          { name: "季節講習・イベントの準備", tag: "調整" },
          { name: "授業観察・指導", tag: "判断" },
          { name: "保護者対応の相談を受ける", tag: "対人" },
          { name: "学校行事の企画・運営", tag: "調整" },
          { name: "教育委員会・外部への対応", tag: "調整" },
        ],
      },
    ],
  },
  {
    id: "engineer",
    name: "ITエンジニア",
    beta: true,
    roles: [
      { id: "member", name: "メンバー" },
      { id: "manager", name: "管理職（マネージャー・リード）" },
    ],
    categories: [
      {
        name: "設計・実装",
        tasks: [
          { name: "要件のヒアリング・整理", tag: "判断" },
          { name: "設計書・仕様書の作成", tag: "判断" },
          { name: "コーディング・実装", tag: "判断" },
          { name: "コードレビュー", tag: "判断" },
          { name: "テスト・デバッグ", tag: "定型" },
          { name: "ドキュメント作成・更新", tag: "定型" },
        ],
      },
      {
        name: "障害・運用",
        tasks: [
          { name: "障害対応・原因調査", tag: "判断" },
          { name: "夜間・休日の緊急対応", tag: "対人" },
          { name: "監視・ログ確認", tag: "定型" },
          { name: "リリース作業", tag: "定型" },
        ],
      },
      {
        name: "会議・調整",
        tasks: [
          { name: "朝会・進捗会議", tag: "調整" },
          { name: "他チーム・他部署との調整", tag: "調整" },
          { name: "顧客・営業からの仕様変更対応", tag: "対人" },
          { name: "スケジュール見積もり", tag: "判断" },
        ],
      },
      {
        name: "環境・雑務",
        tasks: [
          { name: "開発環境の構築・保守", tag: "定型" },
          { name: "技術調査・キャッチアップ", tag: "判断" },
          { name: "採用面接への協力", tag: "対人" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "タスクの割り振り・進捗管理", tag: "調整" },
          { name: "メンバーの1on1・評価", tag: "対人" },
          { name: "採用面接・採用判断", tag: "判断" },
          { name: "予算・人員計画", tag: "判断" },
          { name: "経営層・他部署への報告", tag: "調整" },
        ],
      },
    ],
  },
  {
    id: "childcare",
    name: "保育士",
    beta: true,
    roles: [
      { id: "staff", name: "スタッフ" },
      { id: "manager", name: "管理職（主任・園長）" },
    ],
    categories: [
      {
        name: "保育",
        tasks: [
          { name: "登園・受け入れ対応", tag: "対人" },
          { name: "遊び・活動の見守り", tag: "対人" },
          { name: "食事介助", tag: "身体" },
          { name: "午睡の見守り", tag: "定型" },
          { name: "おむつ替え・トイレ介助", tag: "身体" },
          { name: "着替えの介助", tag: "身体" },
          { name: "降園・お迎え対応", tag: "対人" },
        ],
      },
      {
        name: "保育の準備・記録",
        tasks: [
          { name: "保育計画・指導案の作成", tag: "判断" },
          { name: "制作物・壁面装飾の準備", tag: "定型" },
          { name: "連絡帳の記入", tag: "定型" },
          { name: "保育日誌の記入", tag: "定型" },
          { name: "行事の企画・準備", tag: "判断" },
          { name: "おたより・掲示物の作成", tag: "定型" },
        ],
      },
      {
        name: "保護者対応",
        tasks: [
          { name: "送迎時の会話・報告", tag: "対人" },
          { name: "保護者面談", tag: "対人" },
          { name: "苦情・要望への対応", tag: "対人" },
        ],
      },
      {
        name: "特別な配慮",
        tasks: [
          { name: "発達が気になる子への個別対応", tag: "判断" },
          { name: "アレルギー・体調管理", tag: "判断" },
          { name: "怪我・体調不良時の対応", tag: "対人" },
        ],
      },
      {
        name: "環境・事務",
        tasks: [
          { name: "清掃・消毒", tag: "身体" },
          { name: "玩具・備品の管理", tag: "定型" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "シフト・人員配置の調整", tag: "調整" },
          { name: "行政・自治体への提出書類", tag: "定型" },
          { name: "保護者からのクレーム対応", tag: "対人" },
          { name: "職員の指導・研修", tag: "判断" },
        ],
      },
    ],
  },
  {
    id: "office",
    name: "一般事務",
    beta: true,
    roles: [
      { id: "staff", name: "スタッフ" },
      { id: "manager", name: "管理職" },
    ],
    categories: [
      {
        name: "受付・電話",
        tasks: [
          { name: "来客対応・受付", tag: "対人" },
          { name: "電話対応（問い合わせ・取次）", tag: "調整" },
          { name: "郵便物・宅配便の受け渡し", tag: "定型" },
        ],
      },
      {
        name: "書類・データ入力",
        tasks: [
          { name: "書類の作成・印刷", tag: "定型" },
          { name: "データ入力・システムへの反映", tag: "定型" },
          { name: "ファイリング・書類の整理", tag: "定型" },
          { name: "契約書・請求書の確認", tag: "判断" },
        ],
      },
      {
        name: "経理・総務",
        tasks: [
          { name: "請求書・見積書の発行", tag: "定型" },
          { name: "経費精算のチェック", tag: "定型" },
          { name: "備品・消耗品の発注", tag: "定型" },
          { name: "未収金・支払いの催促", tag: "対人" },
        ],
      },
      {
        name: "スケジュール・調整",
        tasks: [
          { name: "会議室・スケジュールの調整", tag: "調整" },
          { name: "出張手配", tag: "調整" },
          { name: "来客対応のクレーム・苦情", tag: "対人" },
        ],
      },
      {
        name: "その他",
        tasks: [
          { name: "他部署からの依頼対応", tag: "調整" },
          { name: "引き継ぎ資料の作成", tag: "定型" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "シフト・人員配置の作成", tag: "調整" },
          { name: "部署内の進捗管理", tag: "調整" },
          { name: "採用・教育", tag: "判断" },
          { name: "他部署・取引先との折衝", tag: "調整" },
        ],
      },
    ],
  },
  {
    id: "retail",
    name: "小売（店舗販売）",
    beta: true,
    roles: [
      { id: "staff", name: "スタッフ" },
      { id: "manager", name: "店長" },
    ],
    categories: [
      {
        name: "接客・販売",
        tasks: [
          { name: "レジ対応・会計", tag: "定型" },
          { name: "商品説明・接客", tag: "対人" },
          { name: "クレーム・返品対応", tag: "対人" },
          { name: "電話・問い合わせ対応", tag: "調整" },
        ],
      },
      {
        name: "品出し・在庫",
        tasks: [
          { name: "品出し・陳列", tag: "身体" },
          { name: "検品・入荷対応", tag: "定型" },
          { name: "在庫確認・棚卸し", tag: "定型" },
          { name: "発注業務", tag: "判断" },
          { name: "賞味期限・鮮度管理", tag: "定型" },
        ],
      },
      {
        name: "売り場作り",
        tasks: [
          { name: "POP・値札の作成", tag: "定型" },
          { name: "季節・イベントの装飾", tag: "定型" },
          { name: "清掃", tag: "身体" },
        ],
      },
      {
        name: "事務",
        tasks: [
          { name: "レジ締め・売上報告", tag: "定型" },
          { name: "商品知識の勉強", tag: "判断" },
          { name: "新人への指導", tag: "判断" },
        ],
      },
      {
        name: "店長", roles: ["manager"],
        tasks: [
          { name: "シフト作成・人員調整", tag: "調整" },
          { name: "発注量の最終判断", tag: "判断" },
          { name: "売上・数値の分析と報告", tag: "判断" },
          { name: "クレームのエスカレーション対応", tag: "対人" },
          { name: "本部との連絡・報告", tag: "調整" },
          { name: "採用面接", tag: "判断" },
        ],
      },
    ],
  },
  {
    id: "sales",
    name: "営業",
    beta: true,
    roles: [
      { id: "member", name: "メンバー" },
      { id: "manager", name: "管理職" },
    ],
    categories: [
      {
        name: "顧客対応",
        tasks: [
          { name: "新規顧客への架電・アポ取り", tag: "対人" },
          { name: "既存顧客への訪問・フォロー", tag: "対人" },
          { name: "商談・プレゼン", tag: "判断" },
          { name: "クレーム対応", tag: "対人" },
          { name: "見積書・提案書の作成", tag: "定型" },
        ],
      },
      {
        name: "事務・記録",
        tasks: [
          { name: "日報・営業報告の作成", tag: "定型" },
          { name: "顧客管理システム(CRM)への入力", tag: "定型" },
          { name: "契約書の作成・確認", tag: "判断" },
          { name: "請求・入金確認", tag: "定型" },
        ],
      },
      {
        name: "社内調整",
        tasks: [
          { name: "商品部・製造部との在庫確認", tag: "調整" },
          { name: "見積もり条件の社内調整", tag: "調整" },
          { name: "納期・トラブル対応の社内連携", tag: "調整" },
        ],
      },
      {
        name: "移動・準備",
        tasks: [
          { name: "移動時間", tag: "身体" },
          { name: "資料・サンプルの準備", tag: "定型" },
          { name: "展示会・イベントへの出展対応", tag: "調整" },
        ],
      },
      {
        name: "数字管理",
        tasks: [
          { name: "売上目標の進捗管理", tag: "判断" },
          { name: "見込み顧客リストの管理", tag: "定型" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "チームの目標設定・進捗管理", tag: "調整" },
          { name: "同行営業・OJT", tag: "判断" },
          { name: "案件の価格判断・決裁", tag: "判断" },
          { name: "経営会議への報告", tag: "調整" },
        ],
      },
    ],
  },
  {
    id: "restaurant",
    name: "飲食店",
    beta: true,
    roles: [
      { id: "hall", name: "ホール" },
      { id: "kitchen", name: "キッチン" },
      { id: "manager", name: "店長" },
    ],
    categories: [
      {
        name: "ホール業務", roles: ["hall"],
        tasks: [
          { name: "接客・案内", tag: "対人" },
          { name: "注文取り", tag: "定型" },
          { name: "配膳・下膳", tag: "身体" },
          { name: "会計・レジ対応", tag: "定型" },
          { name: "テーブル・店内の清掃", tag: "身体" },
          { name: "クレーム対応", tag: "対人" },
          { name: "予約の電話対応", tag: "調整" },
          { name: "混雑時の待ち時間案内", tag: "対人" },
        ],
      },
      {
        name: "キッチン業務", roles: ["kitchen"],
        tasks: [
          { name: "仕込み", tag: "身体" },
          { name: "調理", tag: "判断" },
          { name: "盛り付け", tag: "定型" },
          { name: "食材の発注・在庫管理", tag: "判断" },
          { name: "検品・食材の保管", tag: "定型" },
          { name: "洗い場・厨房の清掃", tag: "身体" },
          { name: "アレルギー対応の確認", tag: "判断" },
        ],
      },
      {
        name: "共通（ホール・キッチン）", roles: ["hall", "kitchen"],
        tasks: [
          { name: "開店・閉店準備", tag: "定型" },
          { name: "売上・レジの締め作業", tag: "定型" },
          { name: "新人への指導", tag: "判断" },
        ],
      },
      {
        name: "店長", roles: ["manager"],
        tasks: [
          { name: "シフト作成・人員調整", tag: "調整" },
          { name: "発注量の最終判断", tag: "判断" },
          { name: "売上管理・本部への報告", tag: "定型" },
          { name: "クレームのエスカレーション対応", tag: "対人" },
          { name: "採用・面接", tag: "判断" },
          { name: "衛生管理・保健所対応", tag: "判断" },
        ],
      },
    ],
  },
  {
    id: "care",
    name: "介護職（施設）",
    beta: true,
    roles: [
      { id: "staff", name: "スタッフ" },
      { id: "manager", name: "管理職（リーダー・主任）" },
    ],
    categories: [
      {
        name: "身体介助",
        tasks: [
          { name: "食事介助", tag: "身体" },
          { name: "排泄介助・おむつ交換", tag: "身体" },
          { name: "入浴介助", tag: "身体" },
          { name: "移乗・移動の介助", tag: "身体" },
          { name: "体位変換", tag: "身体" },
        ],
      },
      {
        name: "生活援助",
        tasks: [
          { name: "居室清掃・シーツ交換", tag: "身体" },
          { name: "洗濯", tag: "定型" },
          { name: "配膳・下膳", tag: "定型" },
        ],
      },
      {
        name: "見守り・対応",
        tasks: [
          { name: "夜間の巡視", tag: "定型" },
          { name: "ナースコール対応", tag: "調整" },
          { name: "認知症の方の行動への対応", tag: "対人" },
          { name: "転倒・事故時の対応", tag: "判断" },
        ],
      },
      {
        name: "記録・申し送り",
        tasks: [
          { name: "介護記録", tag: "定型" },
          { name: "バイタル・食事量・排泄の記録", tag: "定型" },
          { name: "ヒヤリハット報告", tag: "定型" },
          { name: "申し送り", tag: "定型" },
        ],
      },
      {
        name: "連携",
        tasks: [
          { name: "ケアプランに沿ったケアの確認", tag: "判断" },
          { name: "家族への対応", tag: "対人" },
          { name: "看護師・ケアマネとの連携", tag: "調整" },
        ],
      },
      {
        name: "運営",
        tasks: [
          { name: "レクリエーションの企画・実施", tag: "判断" },
          { name: "物品の管理", tag: "定型" },
          { name: "新人の指導", tag: "判断" },
          { name: "勤務表の作成", tag: "調整", roles: ["manager"] },
        ],
      },
    ],
  },
  {
    id: "manufacturing",
    name: "製造（工場ライン）",
    beta: true,
    roles: [
      { id: "staff", name: "作業者" },
      { id: "manager", name: "管理職（ライン長・班長）" },
    ],
    categories: [
      {
        name: "ライン作業",
        tasks: [
          { name: "組立・加工作業", tag: "身体" },
          { name: "部品・材料のセット", tag: "身体" },
          { name: "検品・検査", tag: "定型" },
          { name: "梱包・出荷準備", tag: "身体" },
          { name: "機械の操作・監視", tag: "定型" },
        ],
      },
      {
        name: "設備・保全",
        tasks: [
          { name: "機械のトラブル対応", tag: "判断" },
          { name: "簡易な保守点検", tag: "定型" },
          { name: "機械の清掃・段取り替え", tag: "身体" },
        ],
      },
      {
        name: "記録・報告",
        tasks: [
          { name: "生産数・不良数の記録", tag: "定型" },
          { name: "日報・作業報告", tag: "定型" },
          { name: "ヒヤリハット・不具合の報告", tag: "定型" },
        ],
      },
      {
        name: "安全・教育",
        tasks: [
          { name: "安全確認・朝礼", tag: "調整" },
          { name: "新人への作業指導", tag: "判断" },
        ],
      },
      {
        name: "身体的負荷",
        tasks: [
          { name: "重量物の運搬", tag: "身体" },
          { name: "立ち仕事・同じ姿勢の継続", tag: "身体" },
          { name: "夜勤・交代勤務", tag: "身体" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "生産計画・人員配置", tag: "調整" },
          { name: "品質トラブルの対応", tag: "判断" },
          { name: "設備投資・改善提案", tag: "判断" },
          { name: "他ライン・他部署との調整", tag: "調整" },
        ],
      },
    ],
  },
  {
    id: "driver",
    name: "ドライバー（配送・トラック）",
    beta: true,
    roles: [
      { id: "driver", name: "ドライバー" },
      { id: "manager", name: "管理職（配車・運行管理）" },
    ],
    categories: [
      {
        name: "配送業務",
        tasks: [
          { name: "運転・配送", tag: "身体" },
          { name: "荷物の積み込み・積み下ろし", tag: "身体" },
          { name: "配送先での荷受け・受け取り確認", tag: "定型" },
          { name: "ルート・配送順の確認", tag: "判断" },
          { name: "渋滞・道路状況による予定変更", tag: "判断" },
        ],
      },
      {
        name: "荷物・車両管理",
        tasks: [
          { name: "車両点検", tag: "定型" },
          { name: "給油・洗車", tag: "定型" },
          { name: "伝票・納品書の管理", tag: "定型" },
          { name: "荷物の破損・誤配対応", tag: "対人" },
        ],
      },
      {
        name: "顧客対応",
        tasks: [
          { name: "配送先での接客", tag: "対人" },
          { name: "不在時の再配達調整", tag: "調整" },
          { name: "クレーム対応", tag: "対人" },
        ],
      },
      {
        name: "記録・報告",
        tasks: [
          { name: "運行記録・日報の記入", tag: "定型" },
        ],
      },
      {
        name: "身体的負荷",
        tasks: [
          { name: "長時間の運転", tag: "身体" },
          { name: "重量物の運搬", tag: "身体" },
          { name: "荷待ち時間", tag: "調整" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "配車・ルートの計画", tag: "判断" },
          { name: "ドライバーの安全教育", tag: "判断" },
          { name: "荷主・取引先との調整", tag: "調整" },
          { name: "事故・トラブル対応", tag: "対人" },
        ],
      },
    ],
  },
  {
    id: "construction",
    name: "建設・現場作業",
    beta: true,
    roles: [
      { id: "staff", name: "作業者" },
      { id: "manager", name: "現場監督" },
    ],
    categories: [
      {
        name: "現場作業",
        tasks: [
          { name: "資材の搬入・運搬", tag: "身体" },
          { name: "組立・施工作業", tag: "身体" },
          { name: "道具・機械の準備と片付け", tag: "身体" },
          { name: "現場の安全確認", tag: "判断" },
          { name: "高所・悪天候下での作業", tag: "身体" },
        ],
      },
      {
        name: "職人・業者との連携",
        tasks: [
          { name: "他業種の職人との作業調整", tag: "調整" },
          { name: "元請け・下請け間の連絡", tag: "調整" },
        ],
      },
      {
        name: "記録・報告",
        tasks: [
          { name: "作業日報の作成", tag: "定型" },
          { name: "写真・進捗記録", tag: "定型" },
          { name: "ヒヤリハット・事故報告", tag: "定型" },
        ],
      },
      {
        name: "安全・教育",
        tasks: [
          { name: "朝礼・安全確認(KY活動)", tag: "調整" },
          { name: "新人・若手への技術指導", tag: "判断" },
        ],
      },
      {
        name: "現場監督", roles: ["manager"],
        tasks: [
          { name: "工程管理・スケジュール調整", tag: "判断" },
          { name: "施主・発注者への報告", tag: "対人" },
          { name: "安全管理・労災対応", tag: "判断" },
          { name: "業者選定・見積もり確認", tag: "判断" },
          { name: "近隣対応・クレーム対応", tag: "対人" },
        ],
      },
    ],
  },
  {
    id: "logistics",
    name: "物流・倉庫",
    beta: true,
    roles: [
      { id: "staff", name: "作業者" },
      { id: "manager", name: "管理職" },
    ],
    categories: [
      {
        name: "入出荷",
        tasks: [
          { name: "荷受け・検品", tag: "定型" },
          { name: "ピッキング", tag: "身体" },
          { name: "梱包・仕分け", tag: "身体" },
          { name: "出荷手配・伝票発行", tag: "定型" },
          { name: "フォークリフト等の運転", tag: "判断" },
        ],
      },
      {
        name: "在庫管理",
        tasks: [
          { name: "在庫の棚卸し", tag: "定型" },
          { name: "在庫データの入力・管理", tag: "定型" },
          { name: "保管場所の整理・ロケーション管理", tag: "定型" },
          { name: "誤出荷・欠品の調査", tag: "判断" },
        ],
      },
      {
        name: "現場管理",
        tasks: [
          { name: "作業動線・レイアウトの調整", tag: "判断" },
          { name: "設備・台車の点検", tag: "定型" },
        ],
      },
      {
        name: "身体的負荷",
        tasks: [
          { name: "重量物の運搬", tag: "身体" },
          { name: "長時間の立ち作業", tag: "身体" },
          { name: "夏場・冬場の倉庫内温度", tag: "身体" },
        ],
      },
      {
        name: "連携・報告",
        tasks: [
          { name: "ドライバー・配送業者とのやり取り", tag: "調整" },
          { name: "クレーム・返品対応", tag: "対人" },
          { name: "作業報告・日報", tag: "定型" },
        ],
      },
      {
        name: "管理職", roles: ["manager"],
        tasks: [
          { name: "人員配置・シフト作成", tag: "調整" },
          { name: "荷主・取引先との調整", tag: "調整" },
          { name: "事故・労災対応", tag: "判断" },
          { name: "業務改善・効率化の検討", tag: "判断" },
        ],
      },
    ],
  },
];
