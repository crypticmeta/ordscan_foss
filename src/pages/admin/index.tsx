import React from "react";
import Link from 'next/link'
function Index() {
  return (
    <div className="custom-container text-white flex flex-wrap items-center">
      <div className="w-full md:w-4/12 lg:w-3/12 p-3">
        <div className="bg-brand_black px-6 py-2 text-center rounded shadow-xl hover:border-brand_red border cursor-pointer">
          <Link href="/admin/collections/add">Add Collection</Link>
        </div>
      </div>
      <div className="w-full md:w-4/12 lg:w-3/12 p-3">
        <div className="bg-brand_black px-6 py-2 text-center rounded shadow-xl hover:border-brand_red border cursor-pointer">
          <Link href="/admin/collections">View All Collections</Link>
        </div>
      </div>
      <div className="w-full md:w-4/12 lg:w-3/12 p-3">
        <div className="bg-brand_black px-6 py-2 text-center rounded shadow-xl hover:border-brand_red border cursor-pointer">
          <Link href="/admin/easyadd">Easy Add Collections</Link>
        </div>
      </div>
      <div className="w-full md:w-4/12 lg:w-3/12 p-3">
        <div className="bg-brand_black px-6 py-2 text-center rounded shadow-xl hover:border-brand_red border cursor-pointer">
          <Link href="/admin/flagged">Flagged</Link>
        </div>
      </div>
    </div>
  );
}

export default Index;
