/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;

  const discountRate = discount / 100;
  const fullPrice = sale_price * quantity;
  const revenue = fullPrice * (1 - discountRate);

  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const profit = seller.profit;

  let bonusRate = 0;

  if (index === 0) {
    bonusRate = 0.15;
  } else if (index === 1 || index === 2) {
    bonusRate = 0.1;
  } else if (index === total - 1) {
    bonusRate = 0;
  } else {
    bonusRate = 0.05;
  }

  const bonus = profit * bonusRate;

  return bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных

  if (!data) {
    throw new Error("Данные не переданы");
  }

  if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Нет данных о продавцах");
  }

  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("Нет данных о товарах");
  }

  if (
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Нет данных о продажах");
  }

  // @TODO: Проверка наличия опций

  if (!options) {
    throw new Error("Опции не переданы");
  }

  const { calculateRevenue, calculateBonus } = options;

  if (typeof calculateRevenue !== "function") {
    throw new Error("Функция расчёта выручки не передана");
  }

  if (typeof calculateBonus !== "function") {
    throw new Error("Функция расчёта бонуса не передана");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellersStats = data.sellers.map((seller) => {
    return {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {},
    };
  });

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellersById = {};

  sellersStats.forEach((seller) => {
    sellersById[seller.seller_id] = seller;
  });

  const productsBySku = {};

  data.products.forEach((product) => {
    productsBySku[product.sku] = product;
  });

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    const seller = sellersById[record.seller_id];

    if (!seller) {
      return;
    }

    seller.sales_count += 1;

    record.items.forEach((item) => {
      const product = productsBySku[item.sku];

      if (!product) {
        return;
      }

      const revenue = calculateRevenue(item, product);
      const cost = product.purchase_price * item.quantity;
      const profit = revenue - cost;

      seller.revenue += revenue;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      seller.products_sold[item.sku] += item.quantity;
    });
  });

  sellersStats.forEach((seller) => {
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => {
        return {
          sku: sku,
          quantity: quantity,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Сортировка продавцов по прибыли

  sellersStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellersStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellersStats.length, seller);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellersStats.map((seller) => {
    return {
      seller_id: seller.seller_id,
      name: seller.name,
      revenue: seller.revenue,
      profit: seller.profit,
      sales_count: seller.sales_count,
      top_products: seller.top_products,
      bonus: seller.bonus,
    };
  });
}
