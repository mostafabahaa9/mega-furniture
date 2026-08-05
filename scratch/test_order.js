async function run() {
  const payload = {
    customerName: "Test User",
    phone: "01000000000",
    email: "test@gmail.com",
    city: "Cairo · القاهرة — EGP 80",
    address: "123 Street",
    notes: "",
    promoCode: null,
    paymentMethod: "cod",
    shippingZoneId: "sh-cairo",
    items: [
      {
        id: "prod-1",
        nameAr: "سرير مودرن",
        nameEn: "Modern Bed",
        price: 12000,
        quantity: 1
      }
    ]
  };

  try {
    const res = await fetch("http://localhost:3001/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
