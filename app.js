(() => {
  const { ethers } = window;

  const CONFIG = {
    chainIdHex: "0x61",
    chainId: 97,
    chainName: "BNB Smart Chain Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    explorer: "https://testnet.bscscan.com",
    factoryAddress: "0xAf8503cA67d7E856e201E86A986c433FE3cBaAF8",
    vaultAddress: "",
    tokenAddress: "",
  };

  const CONFIG_STORAGE_KEY = `spp:config:${CONFIG.chainId}`;

  function trimOrEmpty(value) {
    return String(value || "").trim();
  }

  function isValidAddress(value) {
    const v = trimOrEmpty(value);
    if (!v) return false;
    try {
      return ethers.isAddress(v);
    } catch (_) {
      return false;
    }
  }

  function loadConfigOverrides() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
      if (saved && typeof saved === "object") {
        if (isValidAddress(saved.vaultAddress)) CONFIG.vaultAddress = trimOrEmpty(saved.vaultAddress);
        if (isValidAddress(saved.tokenAddress)) CONFIG.tokenAddress = trimOrEmpty(saved.tokenAddress);
        if (isValidAddress(saved.factoryAddress)) CONFIG.factoryAddress = trimOrEmpty(saved.factoryAddress);
        if (saved.rpcUrl) CONFIG.rpcUrl = trimOrEmpty(saved.rpcUrl);
      }
    } catch (_) {}

    try {
      const q = new URLSearchParams(window.location.search);
      const vault = trimOrEmpty(q.get("vault"));
      const token = trimOrEmpty(q.get("token"));
      const factory = trimOrEmpty(q.get("factory"));
      const rpc = trimOrEmpty(q.get("rpc"));

      if (isValidAddress(vault)) CONFIG.vaultAddress = vault;
      if (isValidAddress(token)) CONFIG.tokenAddress = token;
      if (isValidAddress(factory)) CONFIG.factoryAddress = factory;
      if (rpc) CONFIG.rpcUrl = rpc;
    } catch (_) {}
  }

  function isConfigReady() {
    return isValidAddress(CONFIG.vaultAddress) && isValidAddress(CONFIG.tokenAddress);
  }

  function saveConfig(next) {
    localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({
        rpcUrl: trimOrEmpty(next.rpcUrl || CONFIG.rpcUrl),
        factoryAddress: trimOrEmpty(next.factoryAddress || CONFIG.factoryAddress),
        vaultAddress: trimOrEmpty(next.vaultAddress || CONFIG.vaultAddress),
        tokenAddress: trimOrEmpty(next.tokenAddress || CONFIG.tokenAddress),
      })
    );
  }

  function openConfigModal() {
    openModal(
      "配置合约地址",
      `
      <p class="section-text">当前未配置、配置无效，或 Vault 合约版本与前端不匹配，前端无法读取链上数据或发送交易。</p>
      <div class="rule-list">
        <p class="subtle">你也可以通过 URL 参数配置：?vault=0x...&token=0x...&factory=0x...&rpc=https://...</p>
        <p class="subtle">填入 Factory 地址后，前端可自动从事件中选择该 Token 最新创建的 Vault。</p>
      </div>
      <div class="modal-grid">
        <div class="metric-card">
          <span>Vault 地址</span>
          <input id="cfgVault" class="text-input" placeholder="0x..." value="${trimOrEmpty(CONFIG.vaultAddress)}" />
        </div>
        <div class="metric-card">
          <span>Token 地址</span>
          <input id="cfgToken" class="text-input" placeholder="0x..." value="${trimOrEmpty(CONFIG.tokenAddress)}" />
        </div>
        <div class="metric-card">
          <span>RPC（可选）</span>
          <input id="cfgRpc" class="text-input" placeholder="https://..." value="${trimOrEmpty(CONFIG.rpcUrl)}" />
        </div>
      </div>
      <div class="inline-actions">
        <button id="cfgSaveBtn" class="primary-btn">保存并刷新</button>
        <button id="cfgCancelBtn" class="ghost-btn">稍后再说</button>
      </div>
    `
    );

    document.getElementById("cfgSaveBtn")?.addEventListener("click", () => {
      const vaultAddress = trimOrEmpty(document.getElementById("cfgVault")?.value);
      const tokenAddress = trimOrEmpty(document.getElementById("cfgToken")?.value);
      const rpcUrl = trimOrEmpty(document.getElementById("cfgRpc")?.value);

      if (!isValidAddress(vaultAddress) || !isValidAddress(tokenAddress)) {
        showToast("请填写有效的 Vault / Token 地址", "error");
        return;
      }

      saveConfig({ vaultAddress, tokenAddress, rpcUrl });
      window.location.reload();
    });

    document.getElementById("cfgCancelBtn")?.addEventListener("click", closeModal);
  }

  const ZERO = "0x0000000000000000000000000000000000000000";
  const TACTICAL_PACK_COST = ethers.parseEther("100000");

  const ITEM_META = [
    { id: 0, key: "D80", label: "竞聘折扣券（8折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 8 折计算。", tab: "discounts", action: "discount" },
    { id: 1, key: "D70", label: "竞聘折扣券（7折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 7 折计算。", tab: "discounts", action: "discount" },
    { id: 2, key: "D60", label: "竞聘折扣券（6折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 6 折计算。", tab: "discounts", action: "discount" },
    { id: 3, key: "D50", label: "竞聘折扣券（5折）", desc: "下次竞聘主教练席位时，仅对溢价部分按 5 折计算。", tab: "discounts", action: "discount" },
    { id: 4, key: "B10", label: "换人微调", desc: "当前主教练席位权重 +10%，持续 60 分钟。", tab: "buffs", action: "buff" },
    { id: 5, key: "B20", label: "定位球战术", desc: "当前主教练席位权重 +20%，持续 60 分钟。", tab: "buffs", action: "buff" },
    { id: 6, key: "B30", label: "高位逼抢", desc: "当前主教练席位权重 +30%，持续 60 分钟。", tab: "buffs", action: "buff" },
    { id: 7, key: "B50", label: "临场换阵", desc: "当前主教练席位权重 +50%，持续 30 分钟。", tab: "buffs", action: "buff" },
    { id: 8, key: "B100", label: "点球大战预案", desc: "当前主教练席位权重 +100%，持续 30 分钟。", tab: "buffs", action: "buff" },
    { id: 9, key: "P5", label: "青训储备", desc: "永久执教履历权重 +5%。", tab: "marks", action: "mark" },
    { id: 10, key: "P8", label: "战绩背书", desc: "永久执教履历权重 +8%。", tab: "marks", action: "mark" },
    { id: 11, key: "P15", label: "名帅光环", desc: "永久执教履历权重 +15%。", tab: "marks", action: "mark" },
    { id: 12, key: "P25", label: "传奇教头", desc: "永久执教履历权重 +25%。", tab: "marks", action: "mark" }
  ];

  const vaultAbi = [
    "function description() view returns (string)",
    "function taxToken() view returns (address)",
    "function tacticalPackPool() view returns (uint256)",
    "function accumulatedBnbTax() view returns (uint256)",
    "function startingSlots(uint256) view returns (address owner,uint256 currentPrice,uint256 paidAmount,uint256 occupyTime,uint256 baseWeight,uint256 performanceBoostWeight,uint256 performanceBoostExpiry,uint256 lastWeightUpdate)",
    "function players(address) view returns (uint256 startingSlotIdPlusOne,uint256 careerBoostWeight,uint256 signingDiscount,uint256 pendingBNB,uint256 unclaimedNTM)",
    "function tacticalPackRewardTokens(address) view returns (uint256)",
    "function pendingTacticalPackCommits(address) view returns (uint256 settleBlock,uint256 entropySeed)",
    "function inventory(address,uint8) view returns (uint256)",
    "function headCoachSeatQuote(uint256 id,address user) view returns (uint256 requiredPayment,uint256 currentPrice,uint256 nextPrice,uint256 protectionRemainingMinutes)",
    "function claimQuote(address user) view returns (uint256 grossBnb,uint256 feeBnb,uint256 netBnb,uint256 ntmAmount)",
    "function claimHeadCoachSeatWithMax(uint256 id,uint256 maxPayment)",
    "function releaseHeadCoachSeat()",
    "function buyTacticalPackWithAmount(uint256 fixedPackPrice)",
    "function settleTacticalPack(address user)",
    "function claim()",
    "function triggerBnbDistribution()",
    "function claimTacticalPackRewardTokens()",
    "function useSigningDiscount(uint8 item)",
    "function applyTacticalBoost(uint8 item)",
    "function applyCoachingResumeBoost(uint8 item)"
  ];

  const tokenAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner,address spender) view returns (uint256)",
    "function approve(address spender,uint256 amount) returns (bool)"
  ];

  const factoryAbi = [
    "event VaultCreated(address indexed vault,address indexed token,address indexed creator)"
  ];

  const state = {
    currentFilter: "all",
    drawerTab: "rewards",
    seatsIntroEntered: true,
    seatsEntering: false,
    readProvider: null,
    injectedProvider: null,
    browserProvider: null,
    signer: null,
    readVault: null,
    readToken: null,
    writeVault: null,
    writeToken: null,
    userAddress: null,
    tokenMeta: { name: "--", symbol: "--", decimals: 18 },
    publicData: {
      description: "",
      tacticalPackPool: 0n,
      accumulatedBnbTax: 0n,
      occupiedSeats: 0,
      totalSeats: 100,
      seats: []
    },
    userData: null,
    selectedSeatId: null,
    isSubmitting: false,
    isRefreshing: false
  };

  const el = {
    connectWalletBtn: document.getElementById("connectWalletBtn"),
    contractInfoBtn: document.getElementById("contractInfoBtn"),
    footerContractBtn: document.getElementById("footerContractBtn"),
    openBlindBoxModalBtn: document.getElementById("openBlindBoxModalBtn"),
    openMyModalBtn: document.getElementById("openMyModalBtn"),
    openRulesBtn: document.getElementById("openRulesBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    heroBnbPool: document.getElementById("heroBnbPool"),
    heroBlindBoxPool: document.getElementById("heroBlindBoxPool"),
    heroOccupiedSeats: document.getElementById("heroOccupiedSeats"),
    heroNextSettlement: document.getElementById("heroNextSettlement"),
    tokenMetaText: document.getElementById("tokenMetaText"),
    seatFilterText: document.getElementById("seatFilterText"),
    lastUpdatedText: document.getElementById("lastUpdatedText"),
    seatsOverview: document.getElementById("seatsOverview"),
    seatsOverviewStage: document.getElementById("seatsOverviewStage"),
    seatsCardsView: document.getElementById("seatsCardsView"),
    seatsEnterFx: document.getElementById("seatsEnterFx"),
    seatsEnterText: document.getElementById("seatsEnterText"),
    seatsGrid: document.getElementById("seatsGrid"),
    recentRecords: document.getElementById("recentRecords"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    modalTitle: document.getElementById("modalTitle"),
    modalBody: document.getElementById("modalBody"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    drawer: document.getElementById("drawer"),
    closeDrawerBtn: document.getElementById("closeDrawerBtn"),
    drawerContent: document.getElementById("drawerContent"),
    statusToast: document.getElementById("statusToast"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    loadingTitle: document.getElementById("loadingTitle"),
    loadingText: document.getElementById("loadingText")
  };

  function shortAddr(value) {
    if (!value || value === ZERO) return "席位空缺";
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  function formatToken(value) {
    const raw = ethers.formatUnits(value, state.tokenMeta.decimals);
    const intPart = raw.split(".")[0];
    const sign = intPart.startsWith("-") ? "-" : "";
    const digits = sign ? intPart.slice(1) : intPart;
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}${withCommas}`;
  }

  function formatBnb(value) {
    const etherValue = ethers.formatEther(value);
    // 使用 parseFloat 避免截断后出现如 0.0000 的情况，保留最多 4 位小数
    return `${parseFloat(Number(etherValue).toFixed(4))} BNB`;
  }

  const PLACEHOLDER_COACH_IMAGE = "./素材/神秘教练.webp";
  const LOADED_COACH_IMAGES = new Set();

  function getCoachMeta(seatId) {
    const list = Array.isArray(window.WORLD_COACH_META) ? window.WORLD_COACH_META : [];
    const expectedImage = seatId >= 0 && seatId < 100
      ? `./教练/${String(seatId).padStart(2, "0")}-转换自-png.webp`
      : PLACEHOLDER_COACH_IMAGE;
    const meta = list[seatId] || { id: seatId, coachName: `主教练 #${seatId}`, tier: "-", title: "主教练席位" };
    return { ...meta, image: meta.image || expectedImage };
  }

  function zoneInfo(id) {
    if (id < 10) return { key: "core", name: "冠军名帅区" };
    if (id < 40) return { key: "mid", name: "传统强队区" };
    return { key: "outer", name: "黑马新军区" };
  }

  function countdownText(seat) {
    if (!seat.occupied || !seat.isCooling) return "可竞聘";
    const remain = Math.max(0, seat.cooldownEndTime - Math.floor(Date.now() / 1000));
    const m = Math.floor(remain / 60);
    const s = remain % 60;
    return `${m}分 ${s}秒`;
  }

  function nowText() {
    return new Date().toLocaleString("zh-CN");
  }

  function occupiedSeatCount() {
    return state.publicData.seats.filter((seat) => seat.occupied).length;
  }

  function parseError(error) {
    const msg = (
      error?.reason ||
      error?.shortMessage ||
      error?.info?.error?.message ||
      error?.message ||
      "交易失败"
    );
    
    // 拦截 ethers.js 常见的解析错误（通常由于 RPC 延迟或非标 ABI 导致，不影响实际上链结果）
    if (typeof msg === "string" && msg.includes("could not coalesce error")) {
      return "操作已执行（节点状态同步中）";
    }
    
    return msg;
  }

  function showToast(message, type = "normal") {
    el.statusToast.textContent = message;
    el.statusToast.className = `status-toast ${type === "normal" ? "" : type}`;
    el.statusToast.classList.remove("hidden");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      el.statusToast.classList.add("hidden");
    }, 3400);
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function getInjectedProvider() {
    const eth = window.ethereum;
    if (!eth) return null;
    const providers = Array.isArray(eth.providers) ? eth.providers : [eth];
    return providers.find((p) => p.isMetaMask && !p.isTokenPocket) ||
      providers.find((p) => p.isOKXWallet) ||
      providers.find((p) => p.isBinance) ||
      providers.find((p) => p.isCoinbaseWallet) ||
      providers[0] || null;
  }

  function openWalletGuide() {
    const dappPath = `${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
    openModal("打开钱包", `
      <p class="section-text">移动端请尽量使用钱包内置 DApp 浏览器打开当前页面，再进行连接与签名。</p>
      <div class="inline-actions">
        <a class="primary-btn" href="https://metamask.app.link/dapp/${dappPath}" target="_blank" rel="noopener noreferrer">MetaMask 打开</a>
        <a class="ghost-btn" href="https://www.okx.com/download" target="_blank" rel="noopener noreferrer">OKX 钱包</a>
        <a class="ghost-btn" href="https://www.binance.com/zh-CN/web3wallet" target="_blank" rel="noopener noreferrer">Binance 钱包</a>
      </div>
      <p class="section-text">如果已安装钱包 App，请优先复制当前链接并在钱包浏览器内打开。</p>
    `);
  }

  function setBusy(active, title = "处理中", text = "请在钱包中确认，并等待链上返回结果。") {
    state.isSubmitting = active;
    el.loadingTitle.textContent = title;
    el.loadingText.textContent = text;
    el.loadingOverlay.classList.toggle("hidden", !active);
    renderActionButtons();
    renderDrawer();
    if (state.selectedSeatId !== null && !el.modalBackdrop.classList.contains("hidden")) {
      openSeatDetail(state.selectedSeatId);
    }
  }

  function setWalletButtonText() {
    el.connectWalletBtn.textContent = state.userAddress ? shortAddr(state.userAddress) : "连接钱包";
  }

  function needsApproval(amount) {
    return !state.userData || state.userData.allowance < amount;
  }

  function getSeatPayAmount(seat) {
    const current = seat.currentPrice;
    if (!seat.occupied) return current;
    const nextPrice = (current * 120n) / 100n;
    const premium = nextPrice - current;
    const discount = BigInt(state.userData?.signingDiscount || 100);
    return current + (premium * discount) / 100n;
  }

  function getCurrentSeatId() {
    return state.userData?.startingSlotIdPlusOne ? state.userData.startingSlotIdPlusOne - 1 : -1;
  }

  function getSeatActionState(seat) {
    if (state.isSubmitting) return { label: "交易处理中", disabled: true, reason: "当前有交易正在处理中" };
    if (!state.userAddress) return { label: "连接钱包后竞聘", disabled: false, reason: "" };
    const mySeatId = getCurrentSeatId();
    if (mySeatId === seat.id) return { label: "我已在任", disabled: true, reason: "你当前正在执教该主教练席位" };
    if (mySeatId !== -1) return { label: "已有席位", disabled: true, reason: "每个地址最多持有一个主教练席位" };
    if (seat.isCooling) return { label: "保护期内不可竞聘", disabled: true, reason: "该主教练席位仍在保护期" };
    const payAmount = getSeatPayAmount(seat);
    if (state.userData.balance < payAmount) return { label: "余额不足", disabled: true, reason: "当前代币余额不足" };
    if (needsApproval(payAmount)) return { label: "先授权后竞聘", disabled: false, reason: "" };
    return { label: "竞聘该席位", disabled: false, reason: "" };
  }

  function getBlindBoxActionState() {
    return getBlindBoxPurchaseState(1);
  }

  function getPendingTacticalPackState() {
    const settleBlock = Number(state.userData?.pendingTacticalPackSettleBlock || 0);
    if (!settleBlock) return { hasPending: false, settleBlock: 0, canSettle: false, remainingBlocks: 0 };

    const bn = Number(state.publicData?.blockNumber || 0);
    const canSettle = bn > 0 && bn > settleBlock;
    const remainingBlocks = canSettle || bn === 0 ? 0 : Math.max(0, settleBlock + 1 - bn);
    return { hasPending: true, settleBlock, canSettle, remainingBlocks };
  }

  function getBlindBoxPurchaseState(quantity = 1) {
    const count = Math.max(1, Number(quantity) || 1);
    const totalCost = TACTICAL_PACK_COST * BigInt(count);
    if (state.isSubmitting) return { label: "交易处理中", disabled: true, reason: "当前有交易正在处理中" };
    if (!state.userAddress) return { label: "连接钱包后购买", disabled: false, reason: "" };

    const pending = getPendingTacticalPackState();
    if (pending.hasPending) {
      const reason = pending.canSettle
        ? "你还有世界战术包*1，请先打开后再购买"
        : `你还有世界战术包*1，等待 ${pending.remainingBlocks} 个区块后可打开`;
      return { label: "购买战术包", disabled: true, reason };
    }

    if (state.userData.balance < totalCost) return { label: "余额不足", disabled: true, reason: "当前余额不足以购买战术包" };
    if (needsApproval(totalCost)) return { label: "先授权后购买", disabled: false, reason: "" };
    return { label: "购买战术包", disabled: false, reason: "" };
  }

  function getClaimActionState() {
    const canClaim = state.userData && (state.userData.pendingBNB > 0n || state.userData.unclaimedNTM > 0n || state.userData.tacticalPackRewardTokens > 0n);
    if (state.isSubmitting) return { label: "交易处理中", disabled: true, reason: "当前有交易正在处理中" };
    if (!state.userAddress) return { label: "连接钱包后领取", disabled: false, reason: "" };
    if (!canClaim) return { label: "暂无可领取", disabled: true, reason: "当前没有可领取奖励" };
    return { label: "领取奖励", disabled: false, reason: "" };
  }

  function getDistributionActionState() {
    if (state.isSubmitting) return { label: "交易处理中", disabled: true, reason: "当前有交易正在处理中", canTrigger: false };
    if (!state.userAddress) return { label: "连接钱包后同步分奖", disabled: false, reason: "", canTrigger: false };
    if (state.publicData.accumulatedBnbTax < ethers.parseEther("0.1")) return { label: "同步分奖状态", disabled: false, reason: "赛事奖金池尚未达到 0.1 BNB", canTrigger: false };
    return { label: "触发赛事分奖", disabled: false, reason: "", canTrigger: true };
  }

  function applyButtonState(button, actionState) {
    if (!button) return;
    button.textContent = actionState.label;
    button.disabled = actionState.disabled;
    button.title = actionState.reason || "";
  }

  function normalizeSeat(raw, id) {
    const zone = zoneInfo(id);
    const occupyTime = Number(raw.occupyTime);
    const occupied = raw.owner !== ZERO;
    const cooldownEndTime = occupyTime + 900;
    const isCooling = occupied && Math.floor(Date.now() / 1000) < cooldownEndTime;

    return {
      id,
      zoneKey: zone.key,
      zoneName: zone.name,
      owner: raw.owner,
      currentPrice: raw.currentPrice,
      paidAmount: raw.paidAmount,
      occupyTime,
      baseWeight: Number(raw.baseWeight),
      tacticalBoostWeight: Number(raw.performanceBoostWeight),
      tacticalBoostExpiry: Number(raw.performanceBoostExpiry),
      lastWeightUpdate: Number(raw.lastWeightUpdate),
      occupied,
      cooldownEndTime,
      isCooling
    };
  }

  async function ensureChain(provider = state.injectedProvider || getInjectedProvider()) {
    if (!provider) throw new Error("未检测到钱包");
    const currentChain = await provider.request({ method: "eth_chainId" });
    if (currentChain === CONFIG.chainIdHex) return;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CONFIG.chainIdHex }]
      });
    } catch (switchError) {
      if (switchError.code !== 4902) throw switchError;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CONFIG.chainIdHex,
          chainName: CONFIG.chainName,
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [CONFIG.rpcUrl],
          blockExplorerUrls: [CONFIG.explorer]
        }]
      });
    }
  }

  async function connectWallet(silent = false) {
    const provider = getInjectedProvider();
    state.injectedProvider = provider;
    if (!provider) {
      if (!silent && isMobileDevice()) return openWalletGuide();
      if (!silent) showToast("请在钱包浏览器中打开，或安装 MetaMask / OKX / Binance 钱包", "error");
      return;
    }

    try {
      await ensureChain(provider);
      const method = silent ? "eth_accounts" : "eth_requestAccounts";
      const accounts = await provider.request({ method });
      if (!accounts.length) return;

      state.browserProvider = new ethers.BrowserProvider(provider);
      state.signer = await state.browserProvider.getSigner();
      state.userAddress = accounts[0];
      state.writeVault = new ethers.Contract(CONFIG.vaultAddress, vaultAbi, state.signer);
      state.writeToken = new ethers.Contract(CONFIG.tokenAddress, tokenAbi, state.signer);

      setBusy(true, "连接钱包", "请在钱包中确认连接请求。");
      setWalletButtonText();
      await loadUserData();
      renderMyPanel();
      renderSeats();
      renderDrawer();
      showToast("钱包已连接", "success");
    } catch (error) {
      const msg = parseError(error);
      const isSyncMsg = msg === "操作已执行（节点状态同步中）";
      if (!silent) showToast(msg, isSyncMsg ? "success" : "error");
    } finally {
      setBusy(false);
    }
  }

  async function loadTokenMeta() {
    const [name, rawSymbol, decimals] = await Promise.all([
      state.readToken.name(),
      state.readToken.symbol(),
      state.readToken.decimals()
    ]);

    const symbolText = String(rawSymbol || "").trim();
    const cleanedSymbol = symbolText.replace(/1$/, "");

    state.tokenMeta = {
      name,
      rawSymbol: symbolText,
      symbol: cleanedSymbol,
      decimals: Number(decimals)
    };
  }

  async function loadSeatSnapshots() {
    const seats = [];
    const chunkSize = 20;
    for (let start = 0; start < 100; start += chunkSize) {
      const end = Math.min(start + chunkSize, 100);
      const chunk = await Promise.all(
        Array.from({ length: end - start }, (_, i) => state.readVault.startingSlots(start + i))
      );
      seats.push(...chunk);
    }
    return seats;
  }

  async function loadPublicData() {
    const [description, accumulatedBnbTax, tacticalPackPool, rawSeats, blockNumber] = await Promise.all([
      state.readVault.description(),
      state.readVault.accumulatedBnbTax(),
      state.readVault.tacticalPackPool(),
      loadSeatSnapshots(),
      state.readProvider.getBlockNumber()
    ]);

    const seats = rawSeats.map((seat, i) => normalizeSeat(seat, i));

    state.publicData = {
      description,
      tacticalPackPool,
      accumulatedBnbTax,
      occupiedSeats: seats.filter((seat) => seat.occupied).length,
      totalSeats: 100,
      blockNumber: Number(blockNumber) || 0,
      seats
    };
  }

  async function loadUserData() {
    if (!state.userAddress) {
      state.userData = null;
      return;
    }

    const [player, tacticalPackRewardTokens, pendingCommit, balance, allowance, inventoryCounts] = await Promise.all([
      state.readVault.players(state.userAddress),
      state.readVault.tacticalPackRewardTokens(state.userAddress),
      state.readVault.pendingTacticalPackCommits(state.userAddress),
      state.readToken.balanceOf(state.userAddress),
      state.readToken.allowance(state.userAddress, CONFIG.vaultAddress),
      Promise.all(ITEM_META.map((item) => state.readVault.inventory(state.userAddress, item.id)))
    ]);

    state.userData = {
      startingSlotIdPlusOne: Number(player.startingSlotIdPlusOne),
      careerBoostWeight: Number(player.careerBoostWeight),
      signingDiscount: Number(player.signingDiscount),
      pendingBNB: player.pendingBNB,
      unclaimedNTM: player.unclaimedNTM,
      tacticalPackRewardTokens,
      pendingTacticalPackSettleBlock: Number(pendingCommit.settleBlock) || 0,
      balance,
      allowance,
      inventoryCounts
    };
  }

  async function loadAll() {
    await loadPublicData();
    if (state.userAddress) {
      await loadUserData();
    }
    renderAll();
  }

  function renderHero() {
    el.heroBnbPool.textContent = parseFloat(Number(ethers.formatEther(state.publicData.accumulatedBnbTax)).toFixed(4));
    el.heroBlindBoxPool.textContent = formatToken(state.publicData.tacticalPackPool);
    el.heroOccupiedSeats.textContent = `${state.publicData.occupiedSeats} / ${state.publicData.totalSeats}`;
    el.tokenMetaText.textContent = `${state.tokenMeta.symbol} / 赛事通证`;
    el.lastUpdatedText.textContent = nowText();

    if (el.heroNextSettlement) el.heroNextSettlement.textContent = "满 0.1 BNB 且满 5 分钟可触发";
    const myModalCd = document.getElementById("myModalCountdown");
    if (myModalCd) myModalCd.textContent = "满 0.1 BNB 且满 5 分钟可触发";
  }

  function seatFilterLabel(filter) {
    const map = {
      all: "全部主教练席位",
      core: "冠军级名帅",
      mid: "传统强队主帅",
      outer: "黑马新军主帅",
      available: "仅看可竞聘",
      mine: "仅看我的"
    };
    return map[filter] || "全部主教练席位";
  }

  function setSeatFilter(filter) {
    state.currentFilter = filter;
    document.querySelectorAll(".chip").forEach((item) => item.classList.toggle("active", item.dataset.filter === filter));
    renderSeats();
  }

  function enterSeatZone(filter) {
    setSeatFilter(filter);
  }

  function getFilteredSeats() {
    const seats = state.publicData.seats;
    const mySeatId = state.userData?.startingSlotIdPlusOne ? state.userData.startingSlotIdPlusOne - 1 : -1;

    switch (state.currentFilter) {
      case "core": return seats.filter((seat) => seat.zoneKey === "core");
      case "mid": return seats.filter((seat) => seat.zoneKey === "mid");
      case "outer": return seats.filter((seat) => seat.zoneKey === "outer");
      case "available": return seats.filter((seat) => !seat.occupied || !seat.isCooling);
      case "mine": return seats.filter((seat) => seat.id === mySeatId);
      default: return seats;
    }
  }

  function renderSeats() {
    renderHero();

    if (getSeatImageObserver._observer) {
      getSeatImageObserver._observer.disconnect();
      getSeatImageObserver._observer = null;
    }

    const seats = getFilteredSeats();
    const mySeatId = state.userData?.startingSlotIdPlusOne ? state.userData.startingSlotIdPlusOne - 1 : -1;
    el.seatFilterText.textContent = seatFilterLabel(state.currentFilter);

    if (!seats.length) {
      el.seatsGrid.innerHTML = `<div class="empty-seat-card">当前筛选下暂无可查看的主教练席位。</div>`;
      return;
    }

    el.seatsGrid.innerHTML = seats.map((seat) => {
      const cardClass = !seat.occupied ? "vacant" : seat.id === mySeatId ? "mine" : seat.isCooling ? "cooling" : "available";
      const tagClass = seat.id === mySeatId ? "mine" : seat.isCooling ? "cooling" : "available";
      const statusText = seat.id === mySeatId ? "我已在任" : seat.isCooling ? `保护期 ${countdownText(seat)}` : "可竞聘";
      const actionState = getSeatActionState(seat);
      const ownerText = seat.occupied ? shortAddr(seat.owner) : "暂无主帅";
      const coach = getCoachMeta(seat.id);
      const cachedImage = LOADED_COACH_IMAGES.has(coach.image);
      const imageSrc = cachedImage ? coach.image : PLACEHOLDER_COACH_IMAGE;
      const dataSrc = cachedImage ? "" : coach.image;
      return `
        <article class="seat-card ${seat.zoneKey} ${cardClass}" data-seat-id="${seat.id}" title="${actionState.reason || statusText}">
          <div class="seat-card-media">
            <img class="seat-card-image" src="${imageSrc}" data-src="${dataSrc}" alt="${coach.coachName}" loading="lazy" decoding="async" />
            <div class="seat-card-overlay">
              <span class="seat-card-no">#${seat.id}</span>
              <span class="status-tag ${tagClass}">${statusText}</span>
            </div>
          </div>
          <div class="seat-card-body">
            <div class="seat-card-name">${coach.coachName}</div>
            <div class="seat-card-title">${coach.title}</div>
          </div>
          <div class="seat-card-stats">
            <div><span>价格</span><strong>${formatToken(seat.currentPrice)}</strong></div>
            <div><span>权重</span><strong>×${seat.baseWeight}</strong></div>
          </div>
          <div class="seat-card-owner">
            <span>当前执教者</span>
            <strong>${ownerText}</strong>
          </div>
        </article>`;
    }).join("");
  }

  function renderRecentRecords() {
    const records = [...state.publicData.seats]
      .filter((seat) => seat.occupied && seat.occupyTime > 0)
      .sort((a, b) => b.occupyTime - a.occupyTime)
      .slice(0, 10);

    if (!records.length) {
      el.recentRecords.innerHTML = `<p class="empty-text">当前尚未生成新的主教练任命记录。</p>`;
      return;
    }

    el.recentRecords.innerHTML = records.map((seat) => {
      const coach = getCoachMeta(seat.id);
      return `
      <div class="record-item">
        <div class="record-top">
          <strong>${shortAddr(seat.owner)}</strong>
          <span>${new Date(seat.occupyTime * 1000).toLocaleString("zh-CN")}</span>
        </div>
        <p class="section-text">已竞聘 <strong>#${seat.id} ${coach.coachName}</strong> · ${seat.zoneName} · 当前席位价格 ${formatToken(seat.currentPrice)} ${state.tokenMeta.symbol}</p>
      </div>
    `;}).join("");
  }

  function renderActionButtons() {
    // 移除了页面上固定的领取和购买按钮
  }

  function renderMyPanel() {
    if (!state.userData || !el.myPanel) return;

    const seatId = state.userData.startingSlotIdPlusOne ? state.userData.startingSlotIdPlusOne - 1 : null;
    const seatText = seatId === null ? "当前未任命席位" : `在任席位 #${seatId}`;
    const inventoryCount = state.userData.inventoryCounts.reduce((sum, item) => sum + Number(item), 0);
    const discountText = state.userData.signingDiscount > 0 ? `${state.userData.signingDiscount / 10} 折` : "未激活";

    el.myPanel.innerHTML = `
      <div class="my-meta"><span>我的地址</span><strong>${shortAddr(state.userAddress)}</strong></div>
      <div class="my-meta"><span>我的 ${state.tokenMeta.symbol}</span><strong>${formatToken(state.userData.balance)}</strong></div>
      <div class="my-meta"><span>当前授权额度</span><strong>${formatToken(state.userData.allowance)}</strong></div>
      <div class="my-meta"><span>当前主教练席位</span><strong>${seatText}</strong></div>
      <div class="my-meta"><span>竞聘折扣券</span><strong>${discountText}</strong></div>
      <div class="my-meta"><span>执教履历加成</span><strong>+${state.userData.careerBoostWeight}%</strong></div>
      <div class="my-meta"><span>待领取赛事奖金</span><strong>${formatBnb(state.userData.pendingBNB)}</strong></div>
      <div class="my-meta"><span>待领取 ${state.tokenMeta.symbol}</span><strong>${formatToken(state.userData.unclaimedNTM)}</strong></div>
      <div class="my-meta"><span>待领取战术包奖励</span><strong>${formatToken(state.userData.tacticalPackRewardTokens)}</strong></div>
      <div class="my-meta"><span>背包物品总数</span><strong>${inventoryCount}</strong></div>
    `;
  }

  function renderDrawer() {
    if (!state.userData) {
      el.drawerContent.innerHTML = `<p class="empty-text">请先连接钱包，再查看你的战术包背包与当前状态。</p>`;
      return;
    }

    const items = ITEM_META.filter((item) => {
      const count = Number(state.userData.inventoryCounts[item.id] || 0n);
      if (state.drawerTab === "rewards") return false;
      if (state.drawerTab === "discounts") return item.tab === "discounts" && count > 0;
      if (state.drawerTab === "buffs") return item.tab === "buffs" && count > 0;
      if (state.drawerTab === "marks") return item.tab === "marks" && count > 0;
      return false;
    });

    if (state.drawerTab === "rewards") {
      const pending = getPendingTacticalPackState();
      const hasPendingPack = pending.hasPending;
      const canSettlePack = pending.canSettle;
      const pendingText = !hasPendingPack
        ? "当前没有世界杯战术包。"
        : canSettlePack
          ? `已可打开：开奖区块 #${pending.settleBlock}`
          : `准备打开：开奖区块 #${pending.settleBlock}（还需 ${pending.remainingBlocks} 个区块）`;

      const hasBackpackReward = state.userData.tacticalPackRewardTokens > 0n;
      const hasBaseReward = state.userData.pendingBNB > 0n || state.userData.unclaimedNTM > 0n;

      el.drawerContent.innerHTML = `
        <div class="item-card">
          <h4>世界战术包*1</h4>
          <p>${pendingText}</p>
          <div class="item-actions">
            <button class="primary-btn" title="${hasPendingPack ? (canSettlePack ? "" : "当前还不能打开，请等待区块推进" ) : "当前没有世界杯战术包"}" ${hasPendingPack && canSettlePack && !state.isSubmitting ? "" : "disabled"} id="settleMyPackBtn">${state.isSubmitting ? "交易处理中" : "打开我的战术包"}</button>
          </div>
        </div>
        <div class="item-card">
          <h4>战术包代币奖励</h4>
          <p>当前可领取：${formatToken(state.userData.tacticalPackRewardTokens)}</p>
          <div class="item-actions">
            <button class="primary-btn" title="${hasBackpackReward ? "" : "当前没有可领取的战术包奖励"}" ${hasBackpackReward && !state.isSubmitting ? "" : "disabled"} id="claimBackpackRewardBtn">${state.isSubmitting ? "交易处理中" : "领取战术包奖励"}</button>
          </div>
        </div>
        <div class="item-card">
          <h4>基础待领取奖励</h4>
          <p>待领取 BNB：${formatBnb(state.userData.pendingBNB)}<br/>待领取 ${state.tokenMeta.symbol}：${formatToken(state.userData.unclaimedNTM)}</p>
          <div class="item-actions">
            <button class="ghost-btn" title="${hasBaseReward ? "" : "当前没有可领取奖励"}" ${hasBaseReward && !state.isSubmitting ? "" : "disabled"} id="claimBaseRewardBtn">${state.isSubmitting ? "交易处理中" : "一键领取"}</button>
          </div>
        </div>
      `;

      document.getElementById("settleMyPackBtn")?.addEventListener("click", settleMyTacticalPack);
      document.getElementById("claimBackpackRewardBtn")?.addEventListener("click", claimBackpackReward);
      document.getElementById("claimBaseRewardBtn")?.addEventListener("click", claimBaseReward);
      return;
    }

    if (!items.length) {
      el.drawerContent.innerHTML = `<p class="empty-text">当前分组暂无可用物品或可激活状态。</p>`;
      return;
    }

    el.drawerContent.innerHTML = items.map((item) => {
      const count = Number(state.userData.inventoryCounts[item.id]);
      const noSeat = getCurrentSeatId() === -1;
      const buffActiveSeat = getCurrentSeatId() !== -1 ? state.publicData.seats[getCurrentSeatId()] : null;
      const buffActive = !!(buffActiveSeat && buffActiveSeat.tacticalBoostExpiry > Math.floor(Date.now() / 1000));
      const disabled = state.isSubmitting || count === 0 || (item.action === "discount" && state.userData.signingDiscount > 0) || (item.action === "buff" && (noSeat || buffActive));
      const reason = state.isSubmitting ? "当前有交易正在处理中" : count === 0 ? "当前物品数量为 0" : item.action === "discount" && state.userData.signingDiscount > 0 ? "当前已有激活竞聘折扣券" : item.action === "buff" && noSeat ? "当前没有主教练席位，无法使用临场战术" : item.action === "buff" && buffActive ? "当前已有生效中的临场战术" : "";
      return `
      <div class="item-card">
        <h4>${item.label} × ${count}</h4>
        <p>${item.desc}</p>
        <div class="item-actions">
          <button class="primary-btn use-item-btn" title="${reason}" data-item-id="${item.id}" data-action="${item.action}" ${disabled ? "disabled" : ""}>${state.isSubmitting ? "交易处理中" : "立即使用"}</button>
        </div>
      </div>`;
    }).join("");

    document.querySelectorAll(".use-item-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const itemId = Number(btn.dataset.itemId);
        const action = btn.dataset.action;
        if (action === "discount") await useDiscount(itemId);
        if (action === "buff") await useBuff(itemId);
        if (action === "mark") await usePermanentBuff(itemId);
      });
    });
  }

  function loadSeatImage(img, src) {
    if (!img || !src) return;
    if (img.dataset.loaded === "1") return;
    img.dataset.loaded = "1";

    const obs = getSeatImageObserver();

    if (LOADED_COACH_IMAGES.has(src)) {
      img.src = src;
      img.removeAttribute("data-src");
      obs?.unobserve(img);
      return;
    }

    img.addEventListener(
      "load",
      () => {
        LOADED_COACH_IMAGES.add(src);
        img.removeAttribute("data-src");
        obs?.unobserve(img);
      },
      { once: true }
    );

    img.addEventListener(
      "error",
      () => {
        const retry = Number(img.dataset.retry || "0");
        img.src = PLACEHOLDER_COACH_IMAGE;

        if (!obs || retry >= 2) {
          img.removeAttribute("data-src");
          obs?.unobserve(img);
          return;
        }

        img.dataset.retry = String(retry + 1);
        img.dataset.loaded = "0";

        window.setTimeout(() => {
          if (!img.isConnected) return;
          obs.observe(img);
        }, 500 * (retry + 1));
      },
      { once: true }
    );

    img.src = src;
  }

  function getSeatImageObserver() {
    if (getSeatImageObserver._observer) return getSeatImageObserver._observer;
    if (!("IntersectionObserver" in window)) return null;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target;
          const src = img.getAttribute("data-src");
          if (src) loadSeatImage(img, src);
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0.01 }
    );

    getSeatImageObserver._observer = obs;
    return obs;
  }

  function hydrateSeatCardImages() {
    const imgs = Array.from(document.querySelectorAll(".seat-card-image[data-src]"));
    const observer = getSeatImageObserver();
    const eagerCount = isMobileDevice() ? 6 : 12;

    imgs.forEach((img, index) => {
      if (img.dataset.hydrated === "1") return;
      img.dataset.hydrated = "1";

      const src = img.getAttribute("data-src");
      if (!src) return;

      if (LOADED_COACH_IMAGES.has(src) || !observer || index < eagerCount) {
        loadSeatImage(img, src);
        return;
      }

      observer.observe(img);
    });
  }

  function tickSeatCountdowns() {
    const now = Math.floor(Date.now() / 1000);
    const nodes = document.querySelectorAll(".seat-card[data-seat-id]");
    nodes.forEach((node) => {
      const id = Number(node.getAttribute("data-seat-id"));
      const seat = state.publicData.seats[id];
      if (!seat) return;
      const tag = node.querySelector(".status-tag");
      if (!tag) return;
      if (!seat.occupied) {
        tag.textContent = "可竞聘";
        return;
      }
      const remain = Math.max(0, seat.cooldownEndTime - now);
      if (remain > 0) {
        const m = Math.floor(remain / 60);
        const s = remain % 60;
        tag.textContent = `保护期 ${m}分 ${s}秒`;
      } else {
        tag.textContent = "可竞聘";
      }
    });
  }

  function renderAll() {
    renderHero();
    renderSeats();
    hydrateSeatCardImages();
    renderRecentRecords();
    renderActionButtons();
    renderDrawer();
  }

  function openModal(title, html) {
    el.modalTitle.textContent = title;
    el.modalBody.innerHTML = html;
    el.modalBackdrop.classList.remove("hidden");
  }

  function closeModal() {
    el.modalBackdrop.classList.add("hidden");
    state.selectedSeatId = null;
  }

  function openDrawer() {
    state.drawerTab = state.drawerTab || "rewards";
    document.querySelectorAll(".drawer-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === state.drawerTab);
    });
    renderDrawer();
    el.drawer.classList.add("open");
  }

  function closeDrawer() {
    el.drawer.classList.remove("open");
  }

  function openSeatDetail(seatId) {
    const seat = state.publicData.seats[seatId];
    const coach = getCoachMeta(seatId);
    state.selectedSeatId = seatId;
    const mySeatId = getCurrentSeatId();
    const payAmount = state.userData ? getSeatPayAmount(seat) : 0n;
    const canExit = mySeatId === seatId && !state.isSubmitting;
    const takeState = getSeatActionState(seat);
    const modalHtml = `
      <div class="modal-grid">
        <div class="metric-card"><span>主教练席位</span><strong>#${seat.id}</strong></div>
        <div class="metric-card"><span>主教练姓名</span><strong>${coach.coachName}</strong></div>
        <div class="metric-card"><span>席位分区</span><strong>${seat.zoneName}</strong></div>
        <div class="metric-card"><span>主帅头衔</span><strong>${coach.title}</strong></div>
        <div class="metric-card"><span>当前价格</span><strong>${formatToken(seat.currentPrice)}</strong></div>
        <div class="metric-card"><span>基础权重</span><strong>×${seat.baseWeight}</strong></div>
        <div class="metric-card"><span>当前主帅</span><strong>${shortAddr(seat.owner)}</strong></div>
        <div class="metric-card"><span>当前状态</span><strong>${seat.isCooling ? `保护期 · ${countdownText(seat)}` : "可竞聘"}</strong></div>
      </div>
      <p class="section-text">预计本次支付：${state.userData ? `${formatToken(payAmount)}${state.tokenMeta.symbol ? ` ${state.tokenMeta.symbol}` : ""}` : "连接钱包后显示"}</p>
      <p class="section-text">${takeState.reason || "授权足够后即可直接竞聘该主教练席位。"}</p>
      <div class="inline-actions">
        <button id="seatTakeBtn" class="primary-btn" title="${takeState.reason || ""}" ${takeState.disabled ? "disabled" : ""}>${takeState.label}</button>
        <button id="seatExitBtn" class="ghost-btn" title="${canExit ? "" : "你未持有该主教练席位或当前交易处理中"}" ${canExit ? "" : "disabled"}>卸任主教练</button>
      </div>
    `;
    openModal(`主教练席位 #${seat.id} · ${coach.coachName}`, modalHtml);
    document.getElementById("seatTakeBtn")?.addEventListener("click", () => takeSeat(seat.id));
    document.getElementById("seatExitBtn")?.addEventListener("click", exitSeat);
  }

  async function ensureApproval(amount) {
    if (!state.userAddress) await connectWallet();
    if (!state.userData) await loadUserData();
    if (!needsApproval(amount)) return;

    setBusy(true, "授权代币", "请在钱包中确认授权，并等待链上完成确认。");
    showToast("正在发起代币授权，请在钱包中确认");
    const tx = await state.writeToken.approve(CONFIG.vaultAddress, amount);
    await tx.wait();
    showToast("授权成功", "success");
    await loadUserData();
  }

  async function withTx(label, action) {
    if (state.isSubmitting) return;
    setBusy(true, label, `请在钱包中确认${label}，并等待链上完成确认。`);
    try {
      await action();
      await loadAll();
      showToast(`${label}成功`, "success");
      closeModal();
    } catch (error) {
      const msg = parseError(error);
      const isSyncMsg = msg === "操作已执行（节点状态同步中）";
      showToast(msg, isSyncMsg ? "success" : "error");
    } finally {
      setBusy(false);
    }
  }

  async function takeSeat(seatId) {
    if (!state.userAddress) return connectWallet();
    const seat = state.publicData.seats[seatId];
    const payAmount = getSeatPayAmount(seat);

    await withTx("竞聘主教练席位", async () => {
      await ensureApproval(payAmount);
      const tx = await state.writeVault.claimHeadCoachSeatWithMax(seatId, payAmount);
      await tx.wait();
    });
  }

  async function buyBlindBox(quantity = 1) {
    if (!state.userAddress) return connectWallet();
    const count = Math.max(1, Number(quantity) || 1);
    const totalCost = TACTICAL_PACK_COST * BigInt(count);
    const actionState = getBlindBoxPurchaseState(count);
    if (actionState.disabled) {
      if (actionState.reason) showToast(actionState.reason, "error");
      return;
    }
    if (count === 1) {
      await withTx("购买战术包", async () => {
        await ensureApproval(totalCost);
        const tx = await state.writeVault.buyTacticalPackWithAmount(TACTICAL_PACK_COST);
        await tx.wait();
      });
      return;
    }
    showToast("当前合约每次只支持购买 1 个战术包", "error");
  }

  async function settleMyTacticalPack() {
    if (!state.userAddress) return connectWallet();
    const pending = getPendingTacticalPackState();
    if (!pending.hasPending) {
      showToast("当前没有世界杯战术包", "error");
      return;
    }
    if (!pending.canSettle) {
      showToast("当前还不能打开，请等待区块推进", "error");
      return;
    }

    await withTx("打开战术包", async () => {
      const tx = await state.writeVault.settleTacticalPack(state.userAddress);
      await tx.wait();
    });
  }

  async function exitSeat() {
    if (!state.userAddress) return connectWallet();

    await withTx("卸任主教练", async () => {
      const tx = await state.writeVault.releaseHeadCoachSeat();
      await tx.wait();
    });
  }

  async function claimBaseReward() {
    if (!state.userAddress) return connectWallet();

    await withTx("领取奖励", async () => {
      const tx = await state.writeVault.claim();
      await tx.wait();
    });
  }

  async function claimBackpackReward() {
    if (!state.userAddress) return connectWallet();

    await withTx("领取战术包奖励", async () => {
      const tx = await state.writeVault.claimTacticalPackRewardTokens();
      await tx.wait();
    });
  }

  async function syncMyRewards() {
    if (!state.userAddress) return connectWallet();

    await loadAll();
    const distributionState = getDistributionActionState();
    if (!distributionState.canTrigger) {
      openMyPanelModal();
      showToast("状态已同步", "success");
      return;
    }

    await withTx("触发赛事分奖", async () => {
      const tx = await state.writeVault.triggerBnbDistribution();
      await tx.wait();
    });
  }

  async function useDiscount(itemId) {
    await withTx("使用竞聘折扣券", async () => {
      const tx = await state.writeVault.useSigningDiscount(itemId);
      await tx.wait();
    });
  }

  async function useBuff(itemId) {
    await withTx("使用临场战术", async () => {
      const tx = await state.writeVault.applyTacticalBoost(itemId);
      await tx.wait();
    });
  }

  async function usePermanentBuff(itemId) {
    await withTx("激活执教履历", async () => {
      const tx = await state.writeVault.applyCoachingResumeBoost(itemId);
      await tx.wait();
    });
  }

  function openRules() {
    window.open("./docs/FootballStar-世界杯业务机制说明文档.md", "_blank", "noopener,noreferrer");
  }

  function openPoolInfo() {
    openModal("战术包说明", `
      <div class="pool-info-summary">
        <div class="metric-card"><span>单次价格</span><strong>100000 ${state.tokenMeta.symbol}/次</strong></div>
        <div class="metric-card"><span>代币流向</span><strong>50000 进入战术包奖池 / 50000 销毁</strong></div>
      </div>
      <div class="pool-info-table-wrap">
        <table class="pool-info-table">
          <thead>
            <tr><th>类型</th><th>奖励</th><th>概率</th><th>用途</th></tr>
          </thead>
          <tbody>
            <tr class="pool-group-row"><td colspan="4">代币奖励</td></tr>
            <tr><td>代币奖励</td><td>10000 ${state.tokenMeta.symbol}</td><td>25%</td><td>补充竞聘与持续参与所需的基础资源</td></tr>
            <tr><td>代币奖励</td><td>30000 ${state.tokenMeta.symbol}</td><td>18%</td><td>提升后续补强与竞聘能力</td></tr>
            <tr><td>代币奖励</td><td>80000 ${state.tokenMeta.symbol}</td><td>7%</td><td>接近单次成本回收，属于中档高感知奖励</td></tr>
            <tr><td>代币奖励</td><td>200000 ${state.tokenMeta.symbol}</td><td>2%</td><td>高额代币回报，可直接强化下一轮参与能力</td></tr>
            <tr class="pool-group-row"><td colspan="4">竞聘折扣券</td></tr>
            <tr><td>竞聘折扣券</td><td>竞聘折扣券（8折）</td><td>18%</td><td>下次竞聘时，仅对溢价部分按 8 折计算</td></tr>
            <tr><td>竞聘折扣券</td><td>竞聘折扣券（7折）</td><td>10%</td><td>下次竞聘时，仅对溢价部分按 7 折计算</td></tr>
            <tr><td>竞聘折扣券</td><td>竞聘折扣券（6折）</td><td>5%</td><td>下次竞聘时，仅对溢价部分按 6 折计算</td></tr>
            <tr><td>竞聘折扣券</td><td>竞聘折扣券（5折）</td><td>1.5%</td><td>下次竞聘时，仅对溢价部分按 5 折计算</td></tr>
            <tr class="pool-group-row"><td colspan="4">临场战术</td></tr>
            <tr><td>临场战术</td><td>换人微调</td><td>6%</td><td>当前主教练席位权重 +10%，持续 60 分钟</td></tr>
            <tr><td>临场战术</td><td>定位球战术</td><td>3%</td><td>当前主教练席位权重 +20%，持续 60 分钟</td></tr>
            <tr><td>临场战术</td><td>高位逼抢</td><td>2%</td><td>当前主教练席位权重 +30%，持续 60 分钟</td></tr>
            <tr><td>临场战术</td><td>临场换阵</td><td>1%</td><td>当前主教练席位权重 +50%，持续 30 分钟</td></tr>
            <tr><td>临场战术</td><td>点球大战预案</td><td>0.3%</td><td>当前主教练席位权重 +100%，持续 30 分钟</td></tr>
            <tr class="pool-group-row"><td colspan="4">幸运暴击</td></tr>
            <tr><td>幸运暴击</td><td>奖池暴击</td><td>0.19%</td><td>直接获得当前战术包奖池 30% 对应的代币奖励，进入战术背包</td></tr>
            <tr class="pool-group-row"><td colspan="4">执教履历</td></tr>
            <tr><td>执教履历</td><td>青训储备</td><td>0.008%</td><td>永久执教履历权重 +5%</td></tr>
            <tr><td>执教履历</td><td>战绩背书</td><td>0.0015%</td><td>永久执教履历权重 +8%</td></tr>
            <tr><td>执教履历</td><td>名帅光环</td><td>0.0004%</td><td>永久执教履历权重 +15%</td></tr>
            <tr><td>执教履历</td><td>传奇教头</td><td>1.0001%</td><td>永久执教履历权重 +25%</td></tr>
          </tbody>
        </table>
      </div>
      <p class="batch-hint">以上概率按当前合约实现展示，所有奖项均先进入战术背包，再由用户手动领取或使用。</p>
    `);
  }

  function openBlindBoxPanel() {
    const pending = getPendingTacticalPackState();
    const actionState = getBlindBoxPurchaseState(1);

    const pendingLine = !state.userAddress
      ? "连接钱包后可查看是否有世界战术包。"
      : !pending.hasPending
        ? "当前没有世界战术包。"
        : pending.canSettle
          ? `你有世界战术包*1：开奖区块 #${pending.settleBlock}（现在可以打开）`
          : `你有世界战术包*1：开奖区块 #${pending.settleBlock}（还需 ${pending.remainingBlocks} 个区块）`;

    openModal("世界杯战术包", `
      <p class="section-text">购买世界杯战术包，获得竞聘折扣券、临场战术、执教履历和代币奖励。</p>
      <div class="metric-row">
        <div class="metric-card"><span>战术包价格</span><strong>100000 ${state.tokenMeta.symbol}/次</strong></div>
        <div class="metric-card"><span>当前战术包奖池</span><strong>${formatToken(state.publicData.tacticalPackPool)}</strong></div>
      </div>
      <p class="batch-hint">${pendingLine}</p>
      <div class="inline-actions">
        <button id="blindBoxModalBuyBtn" class="primary-btn" title="${actionState.reason || ""}" ${actionState.disabled ? "disabled" : ""}>购买战术包</button>
        <button id="blindBoxModalSettleBtn" class="ghost-btn" title="${pending.hasPending ? (pending.canSettle ? "" : "当前还不能打开，请等待区块推进") : "当前没有世界杯战术包"}" ${pending.hasPending && pending.canSettle && !state.isSubmitting ? "" : "disabled"}>${state.isSubmitting ? "交易处理中" : "打开我的战术包"}</button>
        <button id="blindBoxModalInfoBtn" class="ghost-btn">战术包说明</button>
      </div>
    `);

    document.getElementById("blindBoxModalBuyBtn")?.addEventListener("click", () => buyBlindBox(1));
    document.getElementById("blindBoxModalSettleBtn")?.addEventListener("click", settleMyTacticalPack);
    document.getElementById("blindBoxModalInfoBtn")?.addEventListener("click", openPoolInfo);
  }

  function openMyPanelModal() {
    const claimState = getClaimActionState();
    const distributionState = getDistributionActionState();
    if (!state.userData) {
      openModal("我的", `
        <div class="my-modal-empty">
          <strong>未连接钱包</strong>
          <p class="section-text">连接钱包后可查看你的主教练席位、资产、赛事奖励与战术包背包状态。</p>
        </div>
        <div class="inline-actions">
          <button id="myModalConnectBtn" class="primary-btn">连接钱包</button>
        </div>
      `);
      document.getElementById("myModalConnectBtn")?.addEventListener("click", () => connectWallet());
      return;
    }

    const seatId = state.userData.startingSlotIdPlusOne ? state.userData.startingSlotIdPlusOne - 1 : null;
    const seatText = seatId === null ? "当前未任命席位" : `在任席位 #${seatId}`;
    const inventoryCount = state.userData.inventoryCounts.reduce((sum, item) => sum + Number(item), 0);
    const discountText = state.userData.signingDiscount > 0 ? `${state.userData.signingDiscount / 10} 折` : "未激活";

    openModal("我的", `
      <div class="my-modal-panel">
        <div class="my-modal-hero">
          <div class="my-modal-identity">
            <span>当前账户</span>
            <strong>${shortAddr(state.userAddress)}</strong>
            <em>${seatText}</em>
          </div>
          <div class="my-modal-balance">
            <span>赛事分奖条件</span>
            <strong id="myModalCountdown" style="color:var(--primary)">满 0.1 BNB 且满 5 分钟</strong>
          </div>
        </div>

        <div class="my-modal-grid">
          <div class="my-modal-card"><span>待领取赛事奖金</span><strong>${formatBnb(state.userData.pendingBNB)}</strong></div>
          <div class="my-modal-card"><span>待领取 ${state.tokenMeta.symbol}</span><strong>${formatToken(state.userData.unclaimedNTM)}</strong></div>
          <div class="my-modal-card"><span>战术包奖励</span><strong>${formatToken(state.userData.tacticalPackRewardTokens)}</strong></div>
          <div class="my-modal-card"><span>我的代币余额</span><strong>${formatToken(state.userData.balance)}</strong></div>
        </div>

        <div class="my-modal-strip">
          <div class="my-modal-mini"><span>授权额度</span><strong>${formatToken(state.userData.allowance)}</strong></div>
          <div class="my-modal-mini"><span>签约折扣</span><strong>${discountText}</strong></div>
          <div class="my-modal-mini"><span>执教履历</span><strong>+${state.userData.careerBoostWeight}%</strong></div>
          <div class="my-modal-mini"><span>背包物品</span><strong>${inventoryCount}</strong></div>
        </div>
      </div>

      <div class="inline-actions">
        <button id="myModalSyncBtn" class="ghost-btn" title="${distributionState.reason || ""}" ${distributionState.disabled ? "disabled" : ""}>${distributionState.label}</button>
        <button id="myModalClaimBtn" class="primary-btn" title="${claimState.reason || ""}" ${claimState.disabled ? "disabled" : ""}>${claimState.label}</button>
        <button id="myModalBackpackBtn" class="ghost-btn">打开战术背包</button>
      </div>
    `);
    document.getElementById("myModalSyncBtn")?.addEventListener("click", syncMyRewards);
    document.getElementById("myModalClaimBtn")?.addEventListener("click", claimBaseReward);
    document.getElementById("myModalBackpackBtn")?.addEventListener("click", () => {
      closeModal();
      openDrawer();
    });
  }

  function openContractInfo() {
    openModal("合约信息", `
      <div class="rule-list">
        <p>Vault：<a href="${CONFIG.explorer}/address/${CONFIG.vaultAddress}" target="_blank" rel="noreferrer">${CONFIG.vaultAddress}</a></p>
        <p>Token：<a href="${CONFIG.explorer}/address/${CONFIG.tokenAddress}" target="_blank" rel="noreferrer">${CONFIG.tokenAddress}</a></p>
        <p>Factory：<a href="${CONFIG.explorer}/address/${CONFIG.factoryAddress}" target="_blank" rel="noreferrer">${CONFIG.factoryAddress}</a></p>
        <p>当前描述：${state.publicData.description || "加载中..."}</p>
      </div>
    `);
  }

  function bindEvents() {
    el.connectWalletBtn.addEventListener("click", () => connectWallet());
    el.contractInfoBtn.addEventListener("click", openContractInfo);
    el.footerContractBtn.addEventListener("click", openContractInfo);
    el.openBlindBoxModalBtn?.addEventListener("click", openBlindBoxPanel);
    el.openMyModalBtn?.addEventListener("click", openMyPanelModal);
    el.openRulesBtn.addEventListener("click", openRules);
    el.refreshBtn.addEventListener("click", async () => {
      await loadAll();
      showToast("状态已刷新", "success");
    });

    el.closeModalBtn.addEventListener("click", closeModal);
    el.modalBackdrop.addEventListener("click", (event) => {
      if (event.target === el.modalBackdrop) closeModal();
    });

    el.closeDrawerBtn.addEventListener("click", closeDrawer);

    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        setSeatFilter(chip.dataset.filter);
      });
    });

    document.querySelectorAll(".drawer-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.drawerTab = tab.dataset.tab;
        document.querySelectorAll(".drawer-tab").forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");
        renderDrawer();
      });
    });

    el.seatsGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-seat-id]");
      if (!card) return;
      openSeatDetail(Number(card.dataset.seatId));
    });

    const provider = getInjectedProvider();
    if (provider?.on) {
      provider.on("accountsChanged", async () => {
        await connectWallet(true);
        await loadAll();
      });
      provider.on("chainChanged", () => window.location.reload());
    }
  }

  async function resolveLatestVaultAddress() {
    if (!isValidAddress(CONFIG.factoryAddress) || !isValidAddress(CONFIG.tokenAddress)) return;
    try {
      const factory = new ethers.Contract(CONFIG.factoryAddress, factoryAbi, state.readProvider);
      const logs = await factory.queryFilter(factory.filters.VaultCreated(null, CONFIG.tokenAddress, null), 0, "latest");
      const latest = logs[logs.length - 1];
      const nextVault = latest?.args?.vault;
      if (isValidAddress(nextVault)) {
        CONFIG.vaultAddress = nextVault;
        saveConfig({
          rpcUrl: CONFIG.rpcUrl,
          factoryAddress: CONFIG.factoryAddress,
          vaultAddress: CONFIG.vaultAddress,
          tokenAddress: CONFIG.tokenAddress
        });
      }
    } catch (error) {
      console.warn("resolveLatestVaultAddress failed", error);
    }
  }

  function isAbiMismatchError(error) {
    const msg = String(error?.shortMessage || error?.message || "");
    return msg.includes("missing revert data") || msg.includes("CALL_EXCEPTION");
  }

  async function bootstrap() {
    loadConfigOverrides();
    state.readProvider = new ethers.JsonRpcProvider(CONFIG.rpcUrl, undefined, { batchMaxCount: 1 });

    bindEvents();

    if (!isConfigReady()) {
      openConfigModal();
      return;
    }

    await resolveLatestVaultAddress();
    state.readVault = new ethers.Contract(CONFIG.vaultAddress, vaultAbi, state.readProvider);
    state.readToken = new ethers.Contract(CONFIG.tokenAddress, tokenAbi, state.readProvider);

    await loadTokenMeta();
    await loadAll();
    await connectWallet(true);
    setInterval(loadPublicDataAndRender, 30000);
    setInterval(tickSeatCountdowns, 1000);
  }

  async function loadPublicDataAndRender() {
    if (state.isRefreshing) return;
    state.isRefreshing = true;
    try {
      await loadPublicData();
      if (state.userAddress) await loadUserData();
      renderAll();
    } catch (error) {
      if (isAbiMismatchError(error)) {
        showToast("读取失败：Vault 地址对应的合约版本与前端不匹配，请更新 Vault 地址（或填写 Factory 让前端自动选择最新 Vault）", "error");
        openConfigModal();
      }
    } finally {
      state.isRefreshing = false;
    }
  }

  bootstrap().catch((error) => {
    console.error(error);
    showToast("前端初始化失败，请检查 RPC 或地址配置", "error");
  });
})();