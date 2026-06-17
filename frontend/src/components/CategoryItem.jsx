import { Link } from "react-router-dom";
import { Tag } from "lucide-react";

const CategoryItem = ({ category }) => {
  return (
    <div className="relative overflow-hidden h-48 w-full rounded-2xl group" style={{ border: "1.5px solid var(--border)" }}>
      <Link to={`/category/${category.name}`}>
        <div className="w-full h-full cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 opacity-50 z-10" />
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--sky)" }}>
              <Tag className="w-10 h-10" style={{ color: "var(--blue)" }} />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
            <h3 className="text-white text-base font-bold capitalize">{category.name}</h3>
            {category.description && (
              <p className="text-gray-200 text-xs mt-0.5 truncate">{category.description}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CategoryItem;
