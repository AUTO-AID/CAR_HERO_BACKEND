import { BadRequestException, Controller, Post, Body, UseGuards, HttpStatus, HttpCode, Get, Query, Param, Patch, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetOrdersUseCase } from '../../application/use-cases/get-orders.use-case';
import { GetOrderByIdUseCase } from '../../application/use-cases/get-order-by-id.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { UpdateOrderUseCase } from '../../application/use-cases/update-order.use-case';
import { AssignProviderUseCase } from '../../application/use-cases/assign-provider.use-case';
import { DeleteOrderUseCase } from '../../application/use-cases/delete-order.use-case';
import { SearchOrdersUseCase } from '../../application/use-cases/search-orders.use-case';
import { GetOrderStatsUseCase } from '../../application/use-cases/get-order-stats.use-case';
import { ExportOrdersUseCase } from '../../application/use-cases/export-orders.use-case';
import { NotifyOrderUseCase } from '../../application/use-cases/notify-order.use-case';
import { ReviewOrderUseCase } from '../../application/use-cases/review-order.use-case';
import { UpdateProviderLocationUseCase } from '../../application/use-cases/update-provider-location.use-case';
import { VerifyPaymentUseCase } from '../../application/use-cases/verify-payment.use-case';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { ReviewOrderDto } from '../../application/dto/review-order.dto';
import { UpdateLocationDto } from '../../application/dto/update-location.dto';
import { VerifyPaymentDto } from '../../application/dto/verify-payment.dto';
import { CancelOrderDto } from '../../application/dto/cancel-order.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { OrderStateMachine } from '../../domain/services/order-state-machine';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly updateOrderUseCase: UpdateOrderUseCase,
    private readonly assignProviderUseCase: AssignProviderUseCase,
    private readonly deleteOrderUseCase: DeleteOrderUseCase,
    private readonly searchOrdersUseCase: SearchOrdersUseCase,
    private readonly getOrderStatsUseCase: GetOrderStatsUseCase,
    private readonly exportOrdersUseCase: ExportOrdersUseCase,
    private readonly notifyOrderUseCase: NotifyOrderUseCase,
    private readonly reviewOrderUseCase: ReviewOrderUseCase,
    private readonly updateProviderLocationUseCase: UpdateProviderLocationUseCase,
    private readonly verifyPaymentUseCase: VerifyPaymentUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service order' })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    createOrderDto.userId = req.user._id; // Force current user
    return this.createOrderUseCase.execute(createOrderDto);
  }

  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a scheduled booking backed by the orders collection' })
  async createBooking(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    if (!createOrderDto.scheduleTime) {
      throw new BadRequestException('scheduleTime is required for bookings');
    }

    createOrderDto.userId = req.user._id;
    return this.createOrderUseCase.execute(createOrderDto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders (Paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  async getAllOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status?: OrderStatus,
    @Req() req?: any
  ) {
    const criteria: any = status ? { status } : {};
    // If not Admin, only show own orders
    if (req.user.role !== 'admin') {
      if (req.user.role === 'provider') criteria.provider = req.user.providerId || req.user._id;
      else criteria.user = req.user._id;
    }
    return this.getOrdersUseCase.execute(criteria, Number(page) || 1, Number(limit) || 10);
  }

  @Get('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get scheduled bookings backed by the orders collection' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  async getAllBookings(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status?: OrderStatus,
    @Req() req?: any
  ) {
    const criteria: any = { isScheduled: true, ...(status ? { status } : {}) };
    if (req.user.role !== 'admin') {
      if (req.user.role === 'provider') criteria.provider = req.user.providerId || req.user._id;
      else criteria.user = req.user._id;
    }
    return this.getOrdersUseCase.execute(criteria, Number(page) || 1, Number(limit) || 10);
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get scheduled booking details by ID' })
  async getBookingById(@Param('id') id: string, @Req() req: any) {
    const order = await this.getOrderByIdUseCase.execute(id, req.user);
    if (!order.isScheduled) {
      throw new BadRequestException('This order is not a scheduled booking');
    }
    return order;
  }

  @Get('orders/search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Search orders by various fields' })
  @ApiQuery({ name: 'query', required: true, type: String })
  async searchOrders(@Query('query') query: string) {
    return this.searchOrdersUseCase.execute(query);
  }

  @Get('orders/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export orders report' })
  async exportReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.exportOrdersUseCase.execute(from, to, status);
  }

  @Get('orders/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics' })
  async getStats(@Query('period') period: string = 'week') {
    return this.getOrderStatsUseCase.execute(period);
  }

  @Get('orders/:id/status-transitions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get allowed next statuses for an order' })
  async getAllowedStatusTransitions(@Param('id') id: string, @Req() req: any) {
    const order = await this.getOrderByIdUseCase.execute(id, req.user);
    return {
      orderId: id,
      currentStatus: order.status,
      allowedNextStatuses: OrderStateMachine.allowedNextStatuses(order.status),
      isTerminal: OrderStateMachine.isTerminal(order.status),
    };
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order details by ID' })
  async getOrderById(@Param('id') id: string, @Req() req: any) {
    return this.getOrderByIdUseCase.execute(id, req.user);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Req() req: any
  ) {
    return this.updateOrderStatusUseCase.execute(id, status, req.user);
  }

  @Patch('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order details' })
  async updateOrder(
    @Param('id') id: string,
    @Body() dto: { scheduleTime?: string; notes?: string; location?: any },
    @Req() req: any
  ) {
    return this.updateOrderUseCase.execute(id, dto);
  }

  @Patch('orders/:id/location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider live location' })
  async updateLocation(
    @Param('id') id: string,
    @Body() locationDto: UpdateLocationDto,
    @Req() req: any
  ) {
    return this.updateProviderLocationUseCase.execute(id, locationDto, req.user);
  }

  @Post('orders/:id/payment/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify and confirm payment for an order' })
  async verifyPayment(
    @Param('id') id: string,
    @Body() verifyPaymentDto: VerifyPaymentDto,
    @Req() req: any
  ) {
    return this.verifyPaymentUseCase.execute(id, verifyPaymentDto);
  }

  @Post('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an order with a reason' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @Req() req: any
  ) {
    return this.cancelOrderUseCase.execute(id, cancelOrderDto, req.user);
  }

  @Post('orders/:id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Review and rate an order' })
  async reviewOrder(
    @Param('id') id: string,
    @Body() reviewDto: ReviewOrderDto,
    @Req() req: any
  ) {
    return this.reviewOrderUseCase.execute(id, reviewDto, req.user);
  }

  @Delete('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order permanently' })
  async deleteOrder(@Param('id') id: string) {
    return this.deleteOrderUseCase.execute(id);
  }
}
