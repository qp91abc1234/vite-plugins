export function set(key: string, param: any) {
  localStorage.setItem(key, JSON.stringify({ val: param }))
}

export function get(key: string) {
  const ret = localStorage.getItem(key) || '{ "val": null }'
  return JSON.parse(ret).val
}
