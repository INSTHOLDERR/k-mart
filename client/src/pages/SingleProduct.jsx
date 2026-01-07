import { useEffect, useState } from "react";
import { useAppContext } from "../context/appContext";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../components/ProductCard";

const SingleProduct = () => {
  const { products, navigate, addToCart, user } = useAppContext(); // Added user from context
  const { id } = useParams();
  const [thumbnail, setThumbnail] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const product = products.find((product) => product._id === id);

  useEffect(() => {
    if (products.length > 0 && product) {
      let productsCopy = products.slice();
      // Fixed: Filter by the SAME category as current product
      productsCopy = productsCopy.filter(
        (item) => item.category === product.category && item._id !== product._id
      );
      setRelatedProducts(productsCopy.slice(0, 5));
    }
  }, [products, product]);

  useEffect(() => {
    setThumbnail(product?.image[0] ? product.image[0] : null);
  }, [product]);

  return (
    product && (
      <div className="mt-16 px-4 md:px-8 lg:px-12">
        {/* Breadcrumb */}
        <p className="text-sm text-gray-600">
          <Link to="/" className="hover:text-primary">Home</Link>
          {" / "}
          <Link to="/products" className="hover:text-red-500">Products</Link>
          {" / "}
          <Link 
            to={`/products/${product.category.toLowerCase()}`}
            className="hover:text-red-700"
          >
            {product.category}
          </Link>
          {" / "}
          <span className="text-red-500">{product.name}</span>
        </p>

        {/* Product Details Section */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 mt-6">
          {/* Images Section */}
          <div className="flex gap-3">
            {/* Thumbnail Images */}
            <div className="flex flex-col gap-3">
              {product.image.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setThumbnail(image)}
                  className={`border max-w-24 rounded overflow-hidden cursor-pointer transition ${
                    thumbnail === image
                      ? "border-primary border-2"
                      : "border-gray-500/30"
                  }`}
                >
                  <img
                    src={`http://localhost:5000/images/${image}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Main Image */}
            <div className="border border-gray-500/30 max-w-96 rounded overflow-hidden">
              <img
                src={`http://localhost:5000/images/${thumbnail}`}
                alt="Selected product"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info Section */}
          <div className="text-sm w-full md:w-1/2">
            <h1 className="text-3xl font-medium">{product.name}</h1>

            {/* Rating */}
            {/* <div className="flex items-center gap-0.5 mt-1">
              {Array(5)
                .fill("")
                .map((_, i) => (
                  <img
                    src={i < product.rating ? assets.star_icon : assets.star_dull_icon}
                    alt="star"
                    key={i}
                    className="w-3.5 md:w-4"
                  />
                ))}
              <p className="text-base ml-2">({product.rating})</p>
            </div> */}

            {/* Price Section with Rupee Symbol */}
            <div className="mt-6">
              <p className="text-gray-500/70 line-through">
                MRP: ₹{product.price}
              </p>
              <p className="text-2xl font-medium text-black-600">
                ₹{product.offerPrice}
              </p>
              <span className="text-gray-500/70 text-xs">
                (inclusive of all taxes)
              </span>
            </div>

            {/* Product Description */}
            <div className="mt-6">
              <p className="text-base font-medium mb-2">About Product</p>
              <ul className="list-disc ml-4 text-gray-500/70 space-y-1">
                {product.description.map((desc, index) => (
                  <li key={index}>{desc}</li>
                ))}
              </ul>
            </div>

            {/* Add to Cart & Buy Buttons - Only show if user is logged in */}
            {user ? (
              <div className="flex items-center mt-10 gap-4 text-base">
                <button
                  onClick={() => addToCart(product._id)}
                  className="w-full py-3.5 cursor-pointer font-medium bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition rounded"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => {
                    addToCart(product._id);
                    navigate("/cart");
                    window.scrollTo(0, 0);
                  }}
                  className="w-full py-3.5 cursor-pointer font-medium bg-red-500 text-white hover:bg-red-600 transition rounded"
                >
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-gray-700">
                  Please{" "}
                  <Link to="/login" className="text-red-500 font-medium hover:underline">
                    login
                  </Link>{" "}
                  to add items to cart or make a purchase.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="flex flex-col items-center mt-20">
          <div className="flex flex-col items-center w-max">
            <p className="text-2xl font-medium">Related Products</p>
            <div className="w-20 h-0.5 bg-red-500 rounded-full mt-2"></div>
          </div>

          {relatedProducts.length > 0 ? (
            <>
              <div className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center justify-center w-full">
                {relatedProducts
                  .filter((product) => product.inStock)
                  .map((product, index) => (
                    <ProductCard key={index} product={product} />
                  ))}
              </div>
              <button
                onClick={() => {
                  navigate("/products");
                  window.scrollTo(0, 0);
                }}
                className="w-full md:w-1/2 my-8 py-3.5 cursor-pointer font-medium bg-red-500 text-white hover:bg-red-600 transition rounded"
              >
                See More
              </button>
            </>
          ) : (
            <p className="text-gray-500 my-8">No related products found.</p>
          )}
        </div>
      </div>
    )
  );
};

export default SingleProduct;