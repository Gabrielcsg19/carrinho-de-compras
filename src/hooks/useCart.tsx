import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { ProductFormatted, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: ProductFormatted[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<ProductFormatted[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: productStock }: { data: Stock } = await api.get(`/stock/${productId}`);
      const { data: product }: { data: ProductFormatted } = await api.get(`/products/${productId}`)
      
      const productAlreadyExistsOnCart = cart.find(cartItem => cartItem.id === product.id)

      if (productAlreadyExistsOnCart) {
        if (productAlreadyExistsOnCart.amount >= productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        } else {
          const updatedCartWithNewAmount = cart.map(cartItem => {
            if (cartItem.id === productStock.id) {
              cartItem.amount += 1;
            }
            return cartItem
          })

          setCart(updatedCartWithNewAmount)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCartWithNewAmount))
          return;
        }
      }

      product.amount = product.amount = 1;
      const updatedCart = [
        ...cart,
        product
      ]
      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      if (!productExists) {
        toast.error('Erro na remoção do produto')
        return;
      }

      setCart(cart.filter(product => product.id !== productId))
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart.filter(product => product.id !== productId)))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: productStock }: { data: Stock } = await api.get(`/stock/${productId}`);

      if (amount <= 0) {
        return;
      }

      if (amount > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCartWithNewAmount = cart.map(cartItem => {
        if (productId === productStock.id) {
         cartItem.amount = amount;
        }

        return cartItem;
      })

      setCart(updatedCartWithNewAmount)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCartWithNewAmount))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
