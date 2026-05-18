class QueryBuilder<T> {
  public modelQuery: any;
  public query: Record<string, any>;

  constructor(modelQuery: any, query: Record<string, any>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = {
        ...this.modelQuery,
        where: {
          ...this.modelQuery.where,
          OR: searchableFields.map((field) => ({
            [field]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          })),
        },
      };
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.query };
    const excludeFields = [
      "searchTerm",
      "sort",
      "sortOrder",
      "limit",
      "page",
      "fields",
    ];
    excludeFields.forEach((el) => delete queryObj[el]);

    // Handle range filtering (e.g. price, stock)
    // Query parameter eivabe thakle: ?min_price=100&max_price=500
    const filterConditions: any = {};
    Object.keys(queryObj).forEach((key) => {
      if (key.includes("min_") || key.includes("max_")) {
        const actualField = key.split("_")[1];
        const isMin = key.includes("min_");

        filterConditions[actualField] = {
          ...filterConditions[actualField],
          [isMin ? "gte" : "lte"]: Number(queryObj[key]),
        };
        delete queryObj[key];
      }
    });

    this.modelQuery = {
      ...this.modelQuery,
      where: {
        ...this.modelQuery.where,
        ...queryObj,
        ...filterConditions,
      },
    };

    return this;
  }

  //sorting
  sort() {
    const sort = (this.query?.sort as string) || "createdAt";
    const sortOrder = (this.query?.sortOrder as string) || "desc";

    this.modelQuery = {
      ...this.modelQuery,
      orderBy: {
        [sort]: sortOrder,
      },
    };
    return this;
  }

  //  pagination
  paginate() {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = {
      ...this.modelQuery,
      skip,
      take: limit,
    };
    return this;
  }

  // specific page selection
  fields() {
    if (this.query?.fields) {
      const fields = (this.query.fields as string)
        .split(",")
        .reduce((acc: any, field) => {
          acc[field.trim()] = true;
          return acc;
        }, {});
      this.modelQuery.select = fields;
    }
    return this;
  }
}

export default QueryBuilder;