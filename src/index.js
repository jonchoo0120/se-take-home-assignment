const { log, writePlain } = require("./logger");

let orderId = 1;
let botId = 1;

let vipQueue = [];
let normalQueue = [];

let processingQueue = [];
let completedOrders = [];

let bots = [];

//Bot
function getNextOrder(vipQueue, normalQueue) {
  if (vipQueue.length > 0) {
    return vipQueue.shift();
  }

  if (normalQueue.length > 0) {
    return normalQueue.shift();
  }

  return null;
}

function startBot(bot) {
  const order = getNextOrder(vipQueue, normalQueue);

  if (!order) {
    log(`Bot #${bot.id} is now IDLE - No pending orders`);
    bot.status = "IDLE";

    return;
  }

  bot.status = "PROCESSING";
  bot.currentOrder = order;

  order.status = "PROCESSING";
  processingQueue.push(order);

  log(`Bot #${bot.id} picked up ${order.type} Order #${order.id} - Status: PROCESSING`);

  bot.timer = setTimeout(() => {
    completeOrder(bot);
  }, 10000);
}

function completeOrder(bot) {
  const order = bot.currentOrder;

  // remove from processing
  processingQueue = processingQueue.filter(o => o.id !== order.id);

  order.status = "COMPLETE";
  completedOrders.push(order);

  log(`Bot #${bot.id} completed ${order.type} Order #${order.id} - Status: COMPLETE (Processing time: 10s)`);

  bot.status = "IDLE";
  bot.currentOrder = null;

  // auto pick next order
  startBot(bot);
}

function assignOrdersToBots() {
  for (let bot of bots) {
    if (bot.status === "IDLE") {
      startBot(bot);
    }
  }
}

//Order
function createVipOrder() {
  const order = {
    id: orderId++,
    type: "VIP",
    status: "PENDING",
  };

  vipQueue.push(order);

  log(`Created VIP Order #${order.id} - Status: PENDING`);

  assignOrdersToBots();
}

function createNormalOrder() {
  const order = {
    id: orderId++,
    type: "NORMAL",
    status: "PENDING",
  };

  normalQueue.push(order);

  log(`Created Normal Order #${order.id} - Status: PENDING`);

  assignOrdersToBots();
}

function addBot() {
  const bot = {
    id: botId++,
    status: "IDLE",
    currentOrder: null,
    timer: null,
  };

  bots.push(bot);

  log(`Bot #${bot.id} created - Status: ACTIVE`);

  assignOrdersToBots();
}

function removeBot() {
  const bot = bots.pop();

  if (!bot) {
    log("No bot to remove");
    return;
  }

  if (bot.timer) {
    clearTimeout(bot.timer);

    if (bot.currentOrder) {
      const order = bot.currentOrder;

      // REMOVE from processing queue
      processingQueue = processingQueue.filter(
        o => o.id !== order.id
      );

      order.status = "PENDING";

      if (order.type === "VIP") {
        vipQueue.unshift(order);
      } else {
        normalQueue.unshift(order);
      }

      log(`Order #${order.id} returned to queue`);
    }
  }

  log(`Bot #${bot.id} removed`);
}

function printFinalStatus() {
  const vipCompleted = completedOrders.filter(
    o => o.type === "VIP"
  ).length;

  const normalCompleted = completedOrders.filter(
    o => o.type === "NORMAL"
  ).length;

  const pendingOrders =
    vipQueue.length + normalQueue.length;

  writePlain("\nFinal Status:");

  writePlain(
    `- Total Orders Processed: ${completedOrders.length} (${vipCompleted} VIP, ${normalCompleted} Normal)`
  );

  writePlain(
    `- Orders Completed: ${completedOrders.length}`
  );

  writePlain(
    `- Active Bots: ${bots.length}`
  );

  writePlain(
    `- Pending Orders: ${pendingOrders}`
  );
}

//CLI
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Type command: new vip | new normal | +bot | -bot");

rl.on("line", (input) => {
  const command = input.trim().toLowerCase();

  if (command === "new vip") {
    createVipOrder();
  }

  else if (command === "new normal") {
    createNormalOrder();
  }

  else if (command === "+bot") {
    addBot();
  }

  else if (command === "-bot") {
    removeBot();
  }

  else {
    log(`Unknown command: ${input}`);
  }

  printState();
});

function printState() {
  console.log("\n===== STATE =====");

  console.log("VIP:", vipQueue.map(o => o.id));
  console.log("Normal:", normalQueue.map(o => o.id));
  console.log("Processing:", processingQueue.map(o => o.id));
  console.log("Completed:", completedOrders.map(o => o.id));

  console.log("Bots:", bots.map(b => ({
    id: b.id,
    status: b.status,
    currentOrder: b.currentOrder?.id || null
  })));

  console.log("================\n");
}

function runSimulation() {
  writePlain(`McDonald's Order Management System - Simulation Results\n`);
  log(`System initialized with ${bots.length} bots`);

  createNormalOrder(); 
  createVipOrder();    
  createNormalOrder(); 

  setTimeout(() => {
    addBot(); // Bot 1 picks VIP #2
  }, 1000);

  setTimeout(() => {
    addBot(); // Bot 2 picks Normal #1
  }, 2000);

  setTimeout(() => {
    createVipOrder(); 
  }, 5000);

  setTimeout(() => {
    createNormalOrder(); 
  }, 6000);

  setTimeout(() => {
    removeBot(); 
    // remove newest bot while processing
    // order should return to queue
  }, 8000);

  setTimeout(() => {
    addBot();
    // new bot should continue pending orders
  }, 12000);

  setTimeout(() => {
    printFinalStatus();
    process.exit(0);
  }, 40000);
}

runSimulation();