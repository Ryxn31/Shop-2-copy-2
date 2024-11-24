$(document).ready(function () {
  // Add to cart functionality
  $(".add-to-cart").click(function () {
    const productId = $(this).data("id");
    $.post("/cart/add", { productId: productId })
      .done(function (response) {
        alert(response.message);
      })
      .fail(function (xhr) {
        alert(xhr.responseJSON.error);
      });
    });

  // Remove from cart functionality
  $(".remove-from-cart").click(function () {
        const productId = $(this).data('id');
    $.ajax({
      url: `/cart/${productId}`,
      type: "DELETE",
      success: function () {
        location.reload(); // Reload the page to reflect changes
      },
      error: function (xhr) {
        alert(xhr.responseText);
      },
        });
    });

  // Update quantity functionality
  $(".quantity").change(function () {
        const productId = $(this).data('id');
    const newQuantity = $(this).val();

        $.ajax({
            url: `/cart/${productId}`,
      type: "PATCH",
      contentType: "application/json",
      data: JSON.stringify({ quantity: newQuantity }),
            success: function() {
                location.reload(); // Reload the page to reflect changes
            },
            error: function(xhr) {
                alert(xhr.responseText);
            }
        });
    });

  // Checkout functionality (placeholder)
  $("#checkout").click(function () {
    alert("Checkout functionality is not implemented yet.");
    // Here you would typically redirect to a checkout page or process the order
    });
});