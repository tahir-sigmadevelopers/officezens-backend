import Order from "../models/order.js";
import Product from "../models/product.js";
import ErrorHandler from "../middlewares/Error.js";

export const createOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingCharges,
      tax,
      total,
      user,
      guestInfo
    } = req.body;

    const orderOptions = {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingCharges,
      tax,
      total,
      paidAt: Date.now(),
    };

    // If user is authenticated, associate order with user
    if (user) {
      orderOptions.user = user;
    }
    // For guest checkout, store the guest email if provided
    else if (guestInfo && guestInfo.email) {
      orderOptions.guestInfo = { email: guestInfo.email };
    }

    await Order.create(orderOptions);

    res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Placing the Order ${error}`, 500)
    );
  }
};

export const myOrders = async (req, res, next) => {
  try {
    let orders;
    
    // If email is provided in query, use it to fetch guest orders
    if (req.query.email) {
      // Find orders where guestInfo.email matches the provided email
      orders = await Order.find({"guestInfo.email": req.query.email});
    } 
    // Otherwise use the authenticated user's ID
    else if (req.user && req.user._id) {
      orders = await Order.find({ user: req.user._id });
    } else {
      return next(new ErrorHandler("Authentication required", 401));
    }
    
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const orderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorHandler("Invalid Id, Order Not Found", 404));
    }

    // For authenticated users, check if the order belongs to them
    if (req.user && req.user._id) {
      if (order.user && order.user.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized to access this order", 403));
      }
    } 
    // For guest users, verify with the email in query param
    else if (req.query.email) {
      if (!order.guestInfo || order.guestInfo.email !== req.query.email) {
        return next(new ErrorHandler("Unauthorized to access this order", 403));
      }
    }
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const ordersCount = await Order.countDocuments();
    let orders = await Order.find().populate("user");

    let totalAmount = 0;

    orders.forEach((order) => {
      totalAmount += order.total;
    });

    return res.status(200).json({
      success: true,
      orders,
      ordersCount,
      totalAmount,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Getting the Orders ${error}`, 500)
    );
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    let order = await Order.findById(id);

    if (!order) return next(new Error(`Order not found`));

    switch (order.orderStatus) {
      case "Processing":
        order.orderStatus = "Shipped";
        break;

      case "Shipped":
        order.orderStatus = "Delivered";
        break;

      default:
        order.orderStatus = "Delivered";
        break;
    }

    // Save with validateBeforeSave: false to skip validation
    await order.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Order Updated Successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
};

export const updateStock = async (id, quantity) => {
  try {
    const product = await Product.findById(id);
    if (!product)
      return next(new ErrorHandler("Invalid Id, Product Not Found", 404));

    if (product.stock >= quantity) {
      product.stock -= quantity;
    }
    if (product.stock < quantity) {
      return new ErrorHandler("We Have Less Stock Of This Product", 404);
    }

    await product.save();
  } catch (error) {
    return new ErrorHandler(error, 500);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return next(new ErrorHandler("Invalid Id, Order Not Found", 404));

    // Chnaging the Order Status

    await Order.deleteOne(order);

    res.status(200).json({
      success: true,
      message: "Order Deleted Successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
};
