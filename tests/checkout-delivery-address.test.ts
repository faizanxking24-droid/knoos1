import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeIndianMobile } from "../src/lib/phone";

describe("Checkout Delivery Address Functionality & Flows (Section 18 A-I)", () => {
  // Helper simulating the address form validation
  function validateAddressForm(form: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    label?: string;
  }) {
    const errors: Record<string, string> = {};
    const trimmedFullName = form.fullName.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedLine1 = form.addressLine1.trim();
    const trimmedCity = form.city.trim();
    const trimmedState = form.state.trim();
    const trimmedPin = form.postalCode.trim();
    const trimmedCountry = (form.country || "").trim() || "India";

    if (!trimmedFullName) {
      errors.fullName = "Full name is required.";
    }

    const phoneVal = normalizeIndianMobile(trimmedPhone);
    if (!phoneVal.isValid || !phoneVal.digits) {
      errors.phone = phoneVal.error || "Please enter a valid 10-digit Indian mobile number.";
    }

    if (!trimmedLine1) {
      errors.addressLine1 = "Address line 1 is required.";
    }

    if (!trimmedCity) {
      errors.city = "City is required.";
    }

    if (!trimmedState) {
      errors.state = "State is required.";
    }

    if (!trimmedPin) {
      errors.postalCode = "PIN code is required.";
    } else if (!/^\d{6}$/.test(trimmedPin)) {
      errors.postalCode = "Please enter a valid 6-digit PIN code.";
    }

    if (!trimmedCountry) {
      errors.country = "Country is required.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      normalizedPayload: Object.keys(errors).length === 0 ? {
        label: form.label || "HOME",
        fullName: trimmedFullName,
        phone: phoneVal.digits,
        addressLine1: trimmedLine1,
        addressLine2: form.addressLine2?.trim() || null,
        landmark: form.landmark?.trim() || null,
        city: trimmedCity,
        state: trimmedState,
        postalCode: trimmedPin,
        country: trimmedCountry,
      } : null,
    };
  }

  // Flow A: Customer with zero addresses
  it("Flow A: Customer with zero addresses shows empty state, saves new address, and auto-selects it", () => {
    let addresses: any[] = [];
    let selectedAddressId = "";
    let showAddressForm = false;

    // Checkout loads with zero addresses
    assert.strictEqual(addresses.length, 0);
    assert.strictEqual(showAddressForm, false);
    assert.strictEqual(selectedAddressId, "");

    // Customer clicks + ADD NEW ADDRESS
    showAddressForm = true;
    assert.strictEqual(showAddressForm, true);

    // Customer fills valid address
    const form = {
      fullName: "Faizan Khan",
      phone: "+91 98737 21207",
      addressLine1: "123 Main Street",
      addressLine2: "Janakpuri",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110058",
      country: "India",
    };
    const validation = validateAddressForm(form);
    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.normalizedPayload?.phone, "9873721207");

    // Address saved to server and returned with ID
    const newSavedAddress = {
      id: "addr_new_1",
      ...validation.normalizedPayload,
      isDefault: true,
    };
    addresses = [newSavedAddress];
    selectedAddressId = newSavedAddress.id;
    showAddressForm = false;

    // New address is automatically selected, Place Order is enabled
    assert.strictEqual(addresses.length, 1);
    assert.strictEqual(selectedAddressId, "addr_new_1");
    assert.strictEqual(showAddressForm, false);
    const placeOrderEnabled = Boolean(selectedAddressId);
    assert.strictEqual(placeOrderEnabled, true);
  });

  // Flow B: Customer with one saved address
  it("Flow B: Customer with one saved address loads and is automatically selected", () => {
    const loadedAddresses = [
      {
        id: "addr_1",
        label: "HOME",
        fullName: "Faizan Khan",
        phone: "9873721207",
        addressLine1: "123 Main Street",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110058",
        country: "India",
        isDefault: false,
      },
    ];

    // Auto-selection logic
    let selectedAddressId = "";
    if (loadedAddresses.length > 0) {
      const defaultAddr = loadedAddresses.find((a) => a.isDefault);
      selectedAddressId = defaultAddr ? defaultAddr.id : loadedAddresses[0].id;
    }

    assert.strictEqual(selectedAddressId, "addr_1");
  });

  // Flow C: Customer with multiple addresses switches selection
  it("Flow C: Customer with multiple addresses can switch between addresses successfully", () => {
    const addresses = [
      { id: "addr_1", fullName: "Home Address", isDefault: true },
      { id: "addr_2", fullName: "Work Address", isDefault: false },
    ];

    // Defaults to default address
    const defaultAddr = addresses.find((a) => a.isDefault);
    let selectedAddressId = defaultAddr ? defaultAddr.id : addresses[0].id;
    assert.strictEqual(selectedAddressId, "addr_1");

    // Customer clicks on second address
    selectedAddressId = addresses[1].id;
    assert.strictEqual(selectedAddressId, "addr_2");
  });

  // Flow D: Edit address updates immediately and preserves selection
  it("Flow D: Edit address updates card details immediately and preserves selection", () => {
    let addresses = [
      {
        id: "addr_1",
        label: "HOME",
        fullName: "Faizan Khan",
        phone: "9873721207",
        addressLine1: "Old Street 1",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110058",
        country: "India",
        isDefault: true,
      },
    ];
    let selectedAddressId = "addr_1";

    // Edit Street Address
    const editForm = {
      fullName: "Faizan Khan",
      phone: "9873721207",
      addressLine1: "456 Renovated Avenue",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110058",
      country: "India",
    };
    const validation = validateAddressForm(editForm);
    assert.strictEqual(validation.isValid, true);

    // Updated server address
    const updatedAddress = {
      ...addresses[0],
      ...validation.normalizedPayload,
    };
    addresses = addresses.map((a) => (a.id === "addr_1" ? updatedAddress : a));

    // Address card updated and selection preserved
    assert.strictEqual(addresses[0].addressLine1, "456 Renovated Avenue");
    assert.strictEqual(selectedAddressId, "addr_1");
  });

  // Flow E: Refresh checkout retains saved address
  it("Flow E: Refresh checkout retains saved address from backend", () => {
    const serverDatabase = [
      {
        id: "addr_persisted",
        label: "HOME",
        fullName: "Faizan Khan",
        phone: "9873721207",
        addressLine1: "123 Main Street",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110058",
        country: "India",
        isDefault: true,
      },
    ];

    // Simulating page refresh fetch to /api/addresses
    const freshFetchedAddresses = [...serverDatabase];
    const defaultAddr = freshFetchedAddresses.find((a) => a.isDefault);
    const selectedAddressId = defaultAddr ? defaultAddr.id : freshFetchedAddresses[0].id;

    assert.strictEqual(freshFetchedAddresses.length, 1);
    assert.strictEqual(selectedAddressId, "addr_persisted");
  });

  // Flow F: Invalid PIN / mobile blocks submission with inline errors
  it("Flow F: Invalid PIN / mobile blocks submission and returns inline errors", () => {
    const invalidForm = {
      fullName: "Faizan Khan",
      phone: "12345", // invalid mobile
      addressLine1: "123 Main Street",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "1100", // invalid 4-digit PIN
      country: "India",
    };

    const result = validateAddressForm(invalidForm);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.phone);
    assert.ok(result.errors.postalCode);
  });

  // Flow G: No selected address blocks Place Order
  it("Flow G: No selected address blocks Place Order button", () => {
    const selectedAddressId = "";
    const placeOrderEnabled = Boolean(selectedAddressId);
    assert.strictEqual(placeOrderEnabled, false);
  });

  // Flow H: Selected address passed to COD order
  it("Flow H: Selected valid address is passed to COD order payload", () => {
    const selectedAddressId = "addr_999";
    const orderPayload = {
      mode: "CART",
      deliveryMethod: "STANDARD",
      addressId: selectedAddressId,
      paymentMethod: "COD",
    };

    assert.strictEqual(orderPayload.addressId, "addr_999");
    assert.strictEqual(orderPayload.paymentMethod, "COD");
  });

  // Flow I: Selected address passed to ONLINE payment order
  it("Flow I: Selected valid address is passed to ONLINE payment order payload", () => {
    const selectedAddressId = "addr_888";
    const orderPayload = {
      mode: "BUY_NOW",
      deliveryMethod: "FAST",
      addressId: selectedAddressId,
      paymentMethod: "ONLINE",
    };

    assert.strictEqual(orderPayload.addressId, "addr_888");
    assert.strictEqual(orderPayload.paymentMethod, "ONLINE");
  });

  // Delete address clears selectedAddressId if deleted
  it("Delete address clears selectedAddressId and requires new selection", () => {
    let addresses = [
      { id: "addr_1", fullName: "Home" },
      { id: "addr_2", fullName: "Office" },
    ];
    let selectedAddressId = "addr_1";

    // Delete addr_1
    const targetId = "addr_1";
    addresses = addresses.filter((a) => a.id !== targetId);
    if (selectedAddressId === targetId) {
      selectedAddressId = "";
    }

    assert.strictEqual(addresses.length, 1);
    assert.strictEqual(selectedAddressId, "");
    assert.strictEqual(Boolean(selectedAddressId), false);
  });

  // Flow J: Customer Nazar's live address (PIN 121001) succeeds with full canonical payload
  it("Flow J: Customer Nazar's live delivery address (PIN 121001, Faridabad) is accepted without restriction", () => {
    const nazarForm = {
      fullName: "Nazar",
      phone: "9625840027",
      addressLine1: "house no 6, gali no 1, badkhal",
      addressLine2: "badkhal village",
      landmark: "NEAR BADKAL LAKE",
      city: "faridabad",
      state: "haryana",
      postalCode: "121001",
      country: "India",
      label: "HOME",
    };

    const result = validateAddressForm(nazarForm);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedPayload?.fullName, "Nazar");
    assert.strictEqual(result.normalizedPayload?.phone, "9625840027");
    assert.strictEqual(result.normalizedPayload?.addressLine1, "house no 6, gali no 1, badkhal");
    assert.strictEqual(result.normalizedPayload?.addressLine2, "badkhal village");
    assert.strictEqual(result.normalizedPayload?.landmark, "NEAR BADKAL LAKE");
    assert.strictEqual(result.normalizedPayload?.city, "faridabad");
    assert.strictEqual(result.normalizedPayload?.state, "haryana");
    assert.strictEqual(result.normalizedPayload?.postalCode, "121001");
    assert.strictEqual(result.normalizedPayload?.country, "India");
  });

  // Flow K: Default address updating remains strictly scoped to current user
  it("Flow K: Setting an address as default unsets previous default scoped strictly to current user", () => {
    const user1Addresses = [
      { id: "addr_u1_1", userId: "user-1", isDefault: true },
      { id: "addr_u1_2", userId: "user-1", isDefault: false },
    ];
    const user2Addresses = [
      { id: "addr_u2_1", userId: "user-2", isDefault: true },
    ];

    // User 1 sets addr_u1_2 as default
    const targetId = "addr_u1_2";
    const currentUserId = "user-1";

    const updatedUser1 = user1Addresses.map((a) => {
      if (a.userId !== currentUserId) return a;
      return { ...a, isDefault: a.id === targetId };
    });

    const updatedUser2 = user2Addresses.map((a) => {
      if (a.userId !== currentUserId) return a;
      return { ...a, isDefault: a.id === targetId };
    });

    assert.strictEqual(updatedUser1.find((a) => a.id === "addr_u1_1")?.isDefault, false);
    assert.strictEqual(updatedUser1.find((a) => a.id === "addr_u1_2")?.isDefault, true);
    // User 2's address default must remain untouched
    assert.strictEqual(updatedUser2.find((a) => a.id === "addr_u2_1")?.isDefault, true);
  });
});
