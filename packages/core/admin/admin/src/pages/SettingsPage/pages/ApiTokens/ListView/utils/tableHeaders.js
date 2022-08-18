const tableHeaders = [
  {
    name: 'name',
    key: 'name',
    metadatas: {
      label: 'Name',
      sortable: true,
    },
  },
  {
    name: 'description',
    key: 'description',
    metadatas: {
      label: 'Description',
      sortable: false,
    },
  },
  {
    name: 'createdAt',
    key: 'createdAt',
    metadatas: {
      label: 'Created at',
      sortable: false,
    },
  },
  {
    name: 'updatedAt',
    key: 'updatedAt',
    metadatas: {
      label: 'Last used',
      sortable: false,
    },
  },
];

export default tableHeaders;
