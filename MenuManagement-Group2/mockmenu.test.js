const { openMenu } = require('./mock_Management'); 

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

