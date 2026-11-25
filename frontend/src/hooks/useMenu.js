import { useEffect, useState } from 'react'
import { menuService } from '../services/menuService.js'

export function useMenu(params = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const query = JSON.stringify(params)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    menuService.products(JSON.parse(query))
      .then(data => { if (active) setProducts(data) })
      .catch(() => { if (active) setError('We couldn’t load the menu just now. Please try again in a moment.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  return { products, loading, error }
}
