import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { ContactService, ContactSearchFilters } from '../../services/contacts/contactService';

const router = Router();
const contactService = new ContactService();

router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { search, isFavorite, limit, offset } = req.query;

    const filters: ContactSearchFilters = {
      search: search as string,
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const result = await contactService.searchContacts(userId, filters);

    res.json({
      success: true,
      data: result.contacts,
      pagination: {
        total: result.total,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contatos',
      error: errorMessage,
    });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const contact = await contactService.getContactById(userId, id!);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contato não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contato',
      error: errorMessage,
    });
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const contactData = req.body;

    const contact = await contactService.createContact(userId, contactData, req);

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contato criado com sucesso',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      success: false,
      message: 'Erro ao criar contato',
      error: errorMessage,
    });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const contactData = req.body;

    const contact = await contactService.updateContact(userId, id!, contactData, req);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contato não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contato atualizado com sucesso',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar contato',
      error: errorMessage,
    });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await contactService.deleteContact(userId, id!, req);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Contato não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Contato excluído com sucesso',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir contato',
      error: errorMessage,
    });
  }
});

export default router;
