const { openMenu } = require('./mock_Management'); // Adjust the path to where your functions are defined

// Mock the database connection
jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn().mockResolvedValue({
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([{
        menu: JSON.stringify({ items: ['Pizza', 'Pasta'] }) // Mock response
      }]),
      release: jest.fn(),
    }),
  }),
}));

describe('Menu Tests', () => {
  it('should fetch the menu for a given restaurant ID', async () => {
    const restaurantID = 1; // Example restaurant ID
    const expectedMenu = { items: ['Pizza', 'Pasta'] };

    const menu = await openMenu(restaurantID);
    
    expect(menu).toEqual(expectedMenu);
  });

  test('openMenu with valid restaurant ID', async () => {
    const callback = jest.fn();
    await openMenu(1, callback);
    expect(callback).toHaveBeenCalledWith(null, expect.any(Object));

});
test('addItem with valid item ID', async () => {
    const callback = jest.fn();
    await addItem(1, callback); // assuming 1 is a valid item ID
    expect(callback).toHaveBeenCalledWith(null, expect.anything());
});
test('deleteItem with existing item ID', async () => {
    const callback = jest.fn();
    await deleteItem(1, callback); // assuming 1 is a valid, existing item ID
    expect(callback).toHaveBeenCalledWith(null, expect.anything());
});


});

describe('Menu Tests', () => {
  it('should fetch the menu for a given restaurant ID', async () => {
    const restaurantID = 1;
    const expectedMenu = {
      items: [
        { itemId: 101, name: "Margherita Pizza", description: "Classic Margherita with fresh mozzarella, tomatoes, and basil.", price: 10.00 },
        { itemId: 102, name: "Spaghetti Carbonara", description: "Spaghetti with creamy carbonara sauce.", price: 12.00 }
      ]
    };

    const menu = await openMenu(restaurantID);
    
    expect(menu).toEqual(expectedMenu);
  });

  test('openMenu with valid restaurant ID', async () => {
    const callback = jest.fn();
    await openMenu(1, callback);
    expect(callback).toHaveBeenCalledWith(null, expect.any(Object));
  });

  test('addItem with valid item ID', async () => {
    const callback = jest.fn();
    await addItem(101, callback); // assuming 101 is a valid item ID
    expect(callback).toHaveBeenCalledWith(null, expect.anything());
  });

  test('deleteItem with existing item ID', async () => {
    const callback = jest.fn();
    await deleteItem(101, callback); // assuming 101 is a valid, existing item ID
    expect(callback).toHaveBeenCalledWith(null, expect.anything());
  });
});

describe('Menu Exception Tests', () => {
  test('openMenu with invalid restaurant ID', async () => {
    const invalidRestaurantID = 999;
    const callback = jest.fn();
    await openMenu(invalidRestaurantID, callback);
    expect(callback).toHaveBeenCalledWith(new Error('Restaurant not found'), null);
  });

  test('addItem with invalid item ID', async () => {
    const invalidItemID = 999;
    const callback = jest.fn();
    await addItem(invalidItemID, callback);
    expect(callback).toHaveBeenCalledWith(new Error('Item not found'), null);
  });

  test('deleteItem with non-existing item ID', async () => {
    const nonExistingItemID = 999;
    const callback = jest.fn();
    await deleteItem(nonExistingItemID, callback);
    expect(callback).toHaveBeenCalledWith(new Error('Item not found'), null);
  });
});