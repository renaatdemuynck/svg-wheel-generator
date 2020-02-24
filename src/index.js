import { ShapeInfo, Intersection } from 'kld-intersections';


/**
 * @typedef {Object} Point
 * @property {number} x - The X coordinate
 * @property {number} y - The Y coordinate
 */

/**
 * Converts degrees to radials
 *
 * @param  {number} deg - An angle in degrees
 * @returns {number} - An angle in radials
 */
function degToRad(deg) {
    return ((deg % 360) - 90) / 180 * Math.PI;
}

/**
 * Gets the X and Y offset for points perpendicular to a line
 *
 * @param {Point} start - The starting point of the line
 * @param {Point} end - The ending point of the line
 * @param {number} offset - The distance of the points perpendicular to the line
 */
function getPerpendicularOffset(start, end, offset) {
    let differenceX = start.x - end.x;
    let differenceY = start.y - end.y;
    let distance = Math.sqrt(Math.pow(differenceX, 2) + Math.pow(differenceY, 2));
    let offsetX = differenceX * offset / distance;
    let offsetY = differenceY * offset / distance;

    return {
        offsetX,
        offsetY
    };
}

/**
 * Gets the point on a circle at the specified angle
 *
 * @param  {number} angle - The angle in degrees
 * @param  {number} radius - The radius of the circle
 * @param  {Point} origin - The origin point of the circle
 * @returns {Point}
 */
export function getPointOnCircle(angle, radius, origin = { x: 0, y: 0 }) {
    return {
        x: origin.x + radius * Math.cos(degToRad(angle)),
        y: origin.y + radius * Math.sin(degToRad(angle))
    };
}

/**
 * Gets the start and end points of a line parallel at a given distance left of another line
 *
 * @param {Point} start - The starting point of the line
 * @param {Point} end - The ending point of the line
 * @param {number} offset - The distance of the parallel to the given line
 */
export function getLeftParallelLine(start, end, offset) {
    let { offsetX, offsetY } = getPerpendicularOffset(start, end, offset);

    return {
        start: {
            x: start.x - offsetY,
            y: start.y + offsetX
        },
        end: {
            x: end.x - offsetY,
            y: end.y + offsetX
        }
    };
}

/**
 * Gets the start and end points of a line parallel at a given distance right of another line
 *
 * @param {Point} start - The starting point of the line
 * @param {Point} end - The ending point of the line
 * @param {number} offset - The distance of the parallel to the given line
 */
export function getRightParallelLine(start, end, offset) {
    let { offsetX, offsetY } = getPerpendicularOffset(start, end, offset);

    return {
        start: {
            x: start.x + offsetY,
            y: start.y - offsetX
        },
        end: {
            x: end.x + offsetY,
            y: end.y - offsetX
        }
    }
}

/**
 * Gets the path of a segment of a wheel
 *
 * @param {number} startAngle - The start angle of the segment
 * @param {number} endAngle - The end angle of the segment
 * @param {number} outerRadius - The outer radius of the segment
 * @param {number} innerRadius - The inner radius of the segment
 * @param {number} spokeWidth - The width of the space between the segments
 * @param {Point} origin - The origin point of the inner and outer circles that make up the segments
 */
export function getWheelSegmentPath(startAngle, endAngle, outerRadius, innerRadius = 0, spokeWidth = 0, origin = { x: 0, y: 0 }) {
    let leftLine = getRightParallelLine(
        origin,
        getPointOnCircle(startAngle, outerRadius, origin),
        spokeWidth / 2
    );
    let rightLine = getLeftParallelLine(
        origin,
        getPointOnCircle(endAngle, outerRadius, origin),
        spokeWidth / 2
    );

    let leftLineShape = ShapeInfo.line(leftLine.start, leftLine.end);
    let rightLineShape = ShapeInfo.line(rightLine.start, rightLine.end);
    let outerCircleShape = ShapeInfo.circle(origin, outerRadius);
    let innerCircleShape = ShapeInfo.circle(origin, innerRadius);

    let outerArcStart = Intersection.intersect(leftLineShape, outerCircleShape).points[0];
    let outerArcEnd = Intersection.intersect(rightLineShape, outerCircleShape).points[0];
    let innerArcStart = Intersection.intersect(rightLineShape, innerCircleShape).points[0];
    let innerArcEnd = Intersection.intersect(leftLineShape, innerCircleShape).points[0];

    return `
        M ${outerArcStart.x} ${outerArcStart.y}
        A ${outerRadius} ${outerRadius} 0 0 1 ${outerArcEnd.x} ${outerArcEnd.y}
        L ${innerArcStart.x} ${innerArcStart.y}
        A ${innerRadius} ${innerRadius} 0 0 0 ${innerArcEnd.x} ${innerArcEnd.y}
        Z
    `;
}

/**
 * Gets the paths of a given number of equal segments of a wheel
 *
 * @param {number} segmentCount - The number of segments to divide the wheel in
 * @param {number} outerRadius - The outer radius of the wheel
 * @param {number} innerRadius - The inner radius of the wheel
 * @param {number} spokeWidth - The width of the space between the segments
 * @param {number} angleOffset - The starting angle of the first segment (starting from the top)
 * @param {Point} origin - The origin point of the inner and outer circles that make up the segments
 */
export function getWheelSegmentPaths(segmentCount, outerRadius, innerRadius = 0, spokeWidth = 0, angleOffset = 0, origin = { x: 0, y: 0 }) {
    let segmentLength = 360 / segmentCount;

    return Array.from({ length: segmentCount }, (currentValue, index) => {
        let startAngle = angleOffset + (index * segmentLength);
        let endAngle = startAngle + segmentLength;

        return getWheelSegmentPath(startAngle, endAngle, outerRadius, innerRadius, spokeWidth, origin);
    });
}

/**
 *
 * @param {number} startAngle - The start angle of the segment
 * @param {number} endAngle - The end angle of the segment
 * @param {number} outerRadius - The outer radius of the segment
 * @param {number} innerRadius - The inner radius of the segment
 * @param {number} spokeWidth - The width of the space between the segments
 * @param {Point} origin - The origin point of the inner and outer circles that make up the segments
 */
export function getWheelSegmentArcTextPath(startAngle, endAngle, outerRadius, innerRadius = 0, spokeWidth = 0, origin = { x: 0, y: 0 }) {
    let leftLine = getRightParallelLine(
        origin,
        getPointOnCircle(startAngle, outerRadius, origin),
        spokeWidth / 2
    );
    let rightLine = getLeftParallelLine(
        origin,
        getPointOnCircle(endAngle, outerRadius, origin),
        spokeWidth / 2
    );

    let middleRadius = (innerRadius + outerRadius) / 2;

    let leftLineShape = ShapeInfo.line(leftLine.start, leftLine.end);
    let rightLineShape = ShapeInfo.line(rightLine.start, rightLine.end);
    let circleShape = ShapeInfo.circle(origin, middleRadius);

    let textPathStart = Intersection.intersect(leftLineShape, circleShape).points[0];
    let textPathEnd = Intersection.intersect(rightLineShape, circleShape).points[0];

    return `
        M ${textPathStart.x} ${textPathStart.y}
        A ${middleRadius} ${middleRadius} 0 0 1 ${textPathEnd.x} ${textPathEnd.y}
    `;
}

/**
 *
 * @param {number} segmentCount - The number of segments to divide the wheel in
 * @param {number} outerRadius - The outer radius of the wheel
 * @param {number} innerRadius - The inner radius of the wheel
 * @param {number} spokeWidth - The width of the space between the segments
 * @param {number} angleOffset - The starting angle of the first segment (starting from the top)
 * @param {Point} origin - The origin point of the inner and outer circles that make up the segments
 */
export function getWheelSegmentArcTextPaths(segmentCount, outerRadius, innerRadius = 0, spokeWidth = 0, angleOffset = 0, origin = { x: 0, y: 0 }) {
    let segmentLength = 360 / segmentCount;

    return Array.from({ length: segmentCount }, (currentValue, index) => {
        let startAngle = angleOffset + (index * segmentLength);
        let endAngle = startAngle + segmentLength;

        return getWheelSegmentArcTextPath(startAngle, endAngle, outerRadius, innerRadius, spokeWidth, origin);
    });
}

/**
 *
 * @param {number} startAngle - The start angle of the segment
 * @param {number} endAngle - The end angle of the segment
 * @param {number} outerRadius - The outer radius of the segment
 * @param {number} innerRadius - The inner radius of the segment
 * @param {number} spokeWidth - The width of the space between the segments
 * @param {Point} origin - The origin point of the inner and outer circles that make up the segments
 */
export function getWheelSegmentLineTextPath(startAngle, endAngle, outerRadius, innerRadius = 0, spokeWidth = 0, origin = { x: 0, y: 0 }) {
    let middleAngle = (startAngle + endAngle) / 2;

    let lineStart = getPointOnCircle(middleAngle, innerRadius, origin);
    let lineEnd = getPointOnCircle(middleAngle, outerRadius + 1, origin);

    let lineShape = ShapeInfo.line(lineStart, lineEnd);
    let innerCircleShape = ShapeInfo.circle(origin, innerRadius);
    let outerCircleShape = ShapeInfo.circle(origin, outerRadius);

    let textPathStart = Intersection.intersect(lineShape, innerCircleShape).points[0];
    let textPathEnd = Intersection.intersect(lineShape, outerCircleShape).points[0];

    return `
        M ${textPathStart.x} ${textPathStart.y}
        L ${textPathEnd.x} ${textPathEnd.y}
    `;
}

/**
 *
 * @param {number} segmentCount - The number of segments to divide the wheel in
 * @param {number} outerRadius - The outer radius of the wheel
 * @param {number} innerRadius - The inner radius of the wheel
 * @param {number} spokeWidth - The width of the space between the segments
 * @param {number} angleOffset - The starting angle of the first segment (starting from the top)
 * @param {Point} origin - The origin point of the inner and outer circles that make up the segments
 */
export function getWheelSegmentLineTextPaths(segmentCount, outerRadius, innerRadius = 0, spokeWidth = 0, angleOffset = 0, origin = { x: 0, y: 0 }) {
    let segmentLength = 360 / segmentCount;

    return Array.from({ length: segmentCount }, (currentValue, index) => {
        let startAngle = angleOffset + (index * segmentLength);
        let endAngle = startAngle + segmentLength;

        return getWheelSegmentLineTextPath(startAngle, endAngle, outerRadius, innerRadius, spokeWidth, origin);
    });
}
